// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import React from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import createSagaMiddleware from 'redux-saga';
import { ThemeProvider } from 'styled-components';
import { JobSubmissionPage } from './job-submission-page';
import reducer from './reducers';
import saga from './sagas';
import theme from './theme';

// create the saga middleware
const sagaMiddleware = createSagaMiddleware();
// mount the saga middleware on the store
const store = createStore(reducer, applyMiddleware(sagaMiddleware));
// run the saga
sagaMiddleware.run(saga);

const App = () => {
  return (
    <Router>
      <Route
        path='/general'
        render={({ history }) => <JobSubmissionPage history={history} />}
      />
    </Router>
  );
};

ReactDOM.render(
  <Provider store={store}>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </Provider>,
  document.getElementById('content-wrapper'),
);
