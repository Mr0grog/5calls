package main

import (
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/fabioberger/airtable-go"
)

const (
	issuesTable   = "Issues list"
	contactsTable = "Contact"
)

var minRefreshInterval = time.Minute

// IssueLister is something that can produce a list of all issues.
type IssueLister interface {
	AllIssues() ([]Issue, error)
}

func asJSON(data interface{}) string {
	b, err := json.Marshal(data)
	if err != nil {
		return fmt.Sprint(data)
	}
	return string(b)
}

// atIssueInfo is the record definition of an issue, minus its key
type atIssueInfo struct {
	Name         string   `json:"Name"`
	Action       string   `json:"Action requested"`
	Script       string   `json:"Script"`
	ContactLinks []string `json:"Contact"`
}

// atIssue is an airtable issue record.
type atIssue struct {
	ID          string `json:"id"`
	atIssueInfo `json:"fields"`
	Contacts    []*atContact `json:"contacts"`
}

func (i *atIssue) String() string { return asJSON(i) }

func (i *atIssue) toIssue(contacts []Contact) Issue {
	return Issue{
		ID:       i.ID,
		Name:     i.Name,
		Reason:   i.Action,
		Script:   i.Script,
		Contacts: contacts,
	}
}

// atContactInfo is the record definition of a contact minus its key.
type atContactInfo struct {
	Name     string `json:"Name"`
	Phone    string `json:"Phone"`
	PhotoURL string `json:"PhotoURL"`
	Area     string `json:"Area"`
	Reason   string `json:"Contact Reason"`
}

// atContact is an airtable contact record.
type atContact struct {
	ID            string `json:"id"`
	atContactInfo `json:"fields"`
}

func (c *atContact) String() string { return asJSON(c) }

func (c *atContact) toContact(cli *AirtableClient, wg *sync.WaitGroup) Contact {
	var photourl string
	if u := strings.TrimSpace(c.PhotoURL); u != "" {
		cacheid := "at-" + c.ID
		wg.Add(1)
		go func() {
			cli.photocache.get(cacheid, u) // cache the image so that we have it when asked for it
			wg.Done()
		}()
		photourl = cli.photocache.url(cacheid)
	}
	return Contact{
		ID:       c.ID,
		Name:     c.Name,
		Phone:    c.Phone,
		PhotoURL: photourl,
		Reason:   c.Reason,
		Area:     c.Area,
	}
}

// AirtableConfig is the configuration for the airtable client.
type AirtableConfig struct {
	BaseID string // ID of the airtable base
	APIKey string // API key for HTTP calls
}

// AirtableClient provides a semantic API to the backend database.
type AirtableClient struct {
	client     *airtable.Client
	photocache *photocache
}

// NewAirtableClient is the AirTableClient factory function.
func NewAirtableClient(config AirtableConfig, photocache *photocache) *AirtableClient {
	c, _ := airtable.New(config.APIKey, config.BaseID)
	return &AirtableClient{client: c, photocache: photocache}
}

// AllIssues returns a list of issues with standard contacts, if any, linked to them.
func (c *AirtableClient) AllIssues() ([]Issue, error) {
	// load all contacts first
	var cList []*atContact
	err := c.client.ListRecords(contactsTable, &cList, airtable.ListParameters{
		FilterByFormula: `NOT(NAME = "")`,
	})
	if err != nil {
		return nil, fmt.Errorf("unable to load contacts, %v", err)
	}
	// index contacts by ID for easy joins
	contactsMap := map[string]*atContact{}
	for _, c := range cList {
		contactsMap[c.ID] = c
	}

	// load all issues
	var list []*atIssue
	err = c.client.ListRecords(issuesTable, &list, airtable.ListParameters{
		FilterByFormula: `NOT(OR(NAME = "", INACTIVE))`,
		Sort: []airtable.SortParameter{
			airtable.SortParameter{
				Field:          "Sort",
				ShouldSortDesc: false,
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("unable to load issues, %v", err)
	}
	// normalize and join with contacts
	var wg sync.WaitGroup
	var ret []Issue
	for _, i := range list {
		var contacts []Contact
		for _, id := range i.ContactLinks {
			contact := contactsMap[id]
			if contact == nil {
				log.Println("[WARN] unable to find contact with ID", id)
				continue
			}
			contacts = append(contacts, contact.toContact(c, &wg))
		}
		ret = append(ret, i.toIssue(contacts))
	}
	wg.Wait()
	return ret, nil
}

// issueCache stores an in-memory copy of the issue list with automatic refresh.
type issueCache struct {
	delegate IssueLister
	stop     chan struct{} // close-only
	force    chan struct{}
	val      atomic.Value // of []Issue
	stopOnce sync.Once
}

// NewIssueCache returns an issue cache after ensuring that the issue list is loaded.
func NewIssueCache(delegate IssueLister, refreshInterval time.Duration) (IssueLister, error) {
	issues, err := delegate.AllIssues()
	if err != nil {
		return nil, err
	}
	if refreshInterval <= minRefreshInterval {
		refreshInterval = minRefreshInterval
	}
	ic := &issueCache{
		delegate: delegate,
		stop:     make(chan struct{}),
		force:    make(chan struct{}, 1),
	}
	ic.val.Store(issues)
	go ic.refresh(refreshInterval)
	return ic, nil
}

// Reload immediately reloads the database in the background.
func (ic *issueCache) Reload() {
	ic.force <- struct{}{}
}

func (ic *issueCache) Close() error {
	ic.stopOnce.Do(func() { close(ic.stop) })
	return nil
}

func (ic *issueCache) refresh(interval time.Duration) {
	reload := func() {
		issues, err := ic.delegate.AllIssues()
		if err != nil {
			log.Println("Error loading issues,", err)
		}
		log.Println(len(issues), "issues loaded")
		ic.val.Store(issues)
	}
	t := time.NewTimer(interval)
	defer t.Stop()
	for {
		select {
		case <-t.C:
			t.Reset(interval)
			reload()
		case <-ic.force:
			t.Reset(interval)
			reload()
		case <-ic.stop:
			return
		}
	}
}

func (ic *issueCache) AllIssues() ([]Issue, error) {
	return ic.val.Load().([]Issue), nil
}
