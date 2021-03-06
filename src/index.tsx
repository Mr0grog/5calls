import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Route, Switch, Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { I18nextProvider } from 'react-i18next';

import createHistory from 'history/createBrowserHistory';
import createStore, { persistor } from './redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import i18n from './services/i18n';
import * as ReactGA from 'react-ga';
import * as Raven from 'raven-js';

import NotFoundPage from './components/NotFoundPage';
import { HomePage } from './components/home';
import { AboutPage } from './components/about';
import { PhonebanksPage } from './components/phonebanks';
import { PostcardsPage } from './components/postcards';
import { FaqPage } from './components/faq';
import { PrivacyPage } from './components/privacy';
import { DonePage } from './components/done';
import { MoreIssuesPage } from './components/issues';
import { CallPage } from './components/call';
import { MyImpactPage } from './components/myimpact';
import { Auth0CallbackContainer } from './components/shared';
import ProfilePageContainer from './components/profile/ProfilePageContainer';
import AppProvider from './components/AppProvider';
import MidtermsPage from './components/MidtermsPage';
import { startup } from './redux/remoteData';
import './components/bundle.css';

ReactGA.initialize('UA-90915119-1');
const trackPageView = location => {
  ReactGA.set({
    page: location.pathname
  });
  ReactGA.pageview(location.pathname);
};

Raven.config('https://7f6e814bc848495aafd63747694a0a30@sentry.io/131886', {
}).install();

const history = createHistory();
trackPageView(history.location);
history.listen(trackPageView);

const store = createStore({});

ReactDOM.render(
  <I18nextProvider i18n={i18n}>
    <Provider store={store}>
      <AppProvider store={store}>
        <PersistGate persistor={persistor} onBeforeLift={() => startup()}>
            <Router history={history}>
              <Switch>
                <Route path="/" exact={true} component={HomePage} />
                <Route path="/issue/:issueid" exact={true} component={CallPage} />
                <Route path="/done/:id" exact={true} component={DonePage} />
                <Route path="/profile" exact={true} component={ProfilePageContainer} />
                <Route path="/impact" exact={true} component={MyImpactPage} />
                <Route path="/more" exact={true} component={MoreIssuesPage} />
                <Route path="/midterms" exact={true} component={MidtermsPage} />
                <Route path="/faq" exact={true} component={FaqPage} />
                <Route path="/privacy" exact={true} component={PrivacyPage} />
                <Route path="/about" exact={true} component={AboutPage} />
                <Route path="/phonebanks" exact={true} component={PhonebanksPage} />
                <Route path="/postcards" exact={true} component={PostcardsPage} />
                <Route path="/auth0callback" exact={true} component={Auth0CallbackContainer} />
                <Route path="*" component={NotFoundPage} />
              </Switch>
            </Router>
        </PersistGate>
      </AppProvider>
    </Provider>
  </I18nextProvider>,
  document.getElementById('root')
);
