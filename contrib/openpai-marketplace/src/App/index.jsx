import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { HashRouter as Router, Route } from 'react-router-dom';
import { Fabric, getNativeProps } from 'office-ui-fabric-react';

import MarketList from '../App/market-list';
import MarketDetail from '../App/market-detail';

const App = props => {
    const { api, user, token, grafanaUri, logType } = props;

    return (
        <Fabric style={{ height: '100%' }}>
        <Router>
            <Route
            path='/'
            exact
            render={({ history }) => (
                <MarketList api={api} user={user} token={token} grafanaUri={grafanaUri} logType={logType} history={history} />
            )}
            />
            <Route
            path={`/market-detail`}
            render={({ history }) => (
                <MarketDetail api={api} history={history}/>
            )}
            />
        </Router>
        </Fabric>
    );
};

export default App;
