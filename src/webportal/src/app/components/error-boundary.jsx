import React from 'react';
import ReactDOM from 'react-dom';

import {MessageBar, MessageBarType} from 'office-ui-fabric-react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
        };
    }

    static getDerivedStateFromError(error) {
        return {
            error: error
        };
    }

    // componentDidCatch(error, errorInfo) {
    //     // Do proper error handling here if needed
    // }

    render() {
        if (this.state.error !== null) {
            return (<MessageBar messageBarType={MessageBarType.error}>
                {this.state.error.toString()}
            </MessageBar>);
        }
        return this.props.children;
    }
}

function renderWithErrorBoundary(element, container, callback) {
    const elementWithErrorBoundary = <ErrorBoundary>{element}</ErrorBoundary>;
    ReactDOM.render(elementWithErrorBoundary, container, callback);
}

export default ErrorBoundary;
export {
    renderWithErrorBoundary,
};
