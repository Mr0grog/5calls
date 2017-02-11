const html = require('choo/html');
const callcount = require('./callcount.js');
const chai = require('chai');
const expect = chai.expect;

describe('callcount component', () => {
  it('should properly forma call total >=1000 with commas', () => {
    let state = {totalCalls: '123456789'};
    let result = callcount(state);
    expect(result.textContent).to.contain('123,456,789');
  });

  it('should properly format call total < 1000 without commas', () => {
    const totals = '123';
    let state = {totalCalls: totals};
    let result = callcount(state);
    // console.log('Result: ', result.childNodes);
    expect(result.textContent).to.contain(totals);
    expect(result.textContent).to.not.contain(',');
  });

  it('should not format zero call total', () => {
    const totals = '0';
    let state = {totalCalls: totals};
    let result = callcount(state);
    // console.log('Result: ', result.childNodes);
    // expect(result.childNodes[1].data).to.contain('123');
    expect(result.textContent).to.contain(totals);
    expect(result.textContent).to.not.contain(',');
  });

});
