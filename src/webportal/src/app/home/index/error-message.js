import React, {useState, useEffect, useCallback} from 'react';
import c from 'classnames';
import querystring from 'querystring';
import t from 'tachyons-sass/tachyons.scss';
import {Link, MessageBar, MessageBarType} from 'office-ui-fabric-react';

export function ErrorMessage() {
  const [errorMessages, setErrorMessages] = useState();
  useEffect(() => {
    const query = querystring.parse(location.search.replace(/^\?/, ''));
    if (query.statusCode && query.statusCode === '400' && query.mtuserLink) {
      const message = (
        <span className={c(t.f6)}>
          User {query.username} is not found. Please join mtuser security group
          <Link href={query.mtuserLink} target="_blank">
            {query.mtuserLink}
          </Link>
          .&nbsp;May take one day to take effect.
        </span>
      );
      setErrorMessages(message);
    }
  }, []);

  const closeMessageBar = useCallback(() => {
    setErrorMessages();
    location.href = new URL('/index.html', window.location.href).href;
  }, []);

  return errorMessages ? (
    <div className={c(t.absolute, t.w100)}>
      <MessageBar
        messageBarType={MessageBarType.error}
        onDismiss={closeMessageBar}
        isMultiline={false}
        dismissButtonAriaLabel="Close"
      >
        {errorMessages}
      </MessageBar>
    </div>
  ) : null;
}
