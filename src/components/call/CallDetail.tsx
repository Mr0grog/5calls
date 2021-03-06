import * as React from 'react';
import { Issue } from '../../common/model';
import { ContactDetails } from './index';

interface Props {
  readonly currentIssue: Issue;
}

const CallDetail: React.StatelessComponent<Props> = (props: Props) => (
  <div>
    <ContactDetails
      currentIssue={props.currentIssue}
      contactIndex={0}
    />
  </div>

);

export default CallDetail;
