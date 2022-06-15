import { FormControl } from '@erxes/ui/src/components/form';
import React from 'react';
import { IClientPortalUser } from '../../types';

type Props = {
  clientPortalUser: IClientPortalUser;
  history: any;
  isChecked: boolean;
  toggleBulk: (
    clientPortalUser: IClientPortalUser,
    isChecked?: boolean
  ) => void;
};

class Row extends React.Component<Props> {
  render() {
    const { clientPortalUser, history, toggleBulk, isChecked } = this.props;

    const onChange = e => {
      if (toggleBulk) {
        toggleBulk(clientPortalUser, e.target.checked);
      }
    };

    const onClick = e => {
      e.stopPropagation();
    };

    const {
      firstName,
      lastName,
      username,
      email,
      createdAt
    } = clientPortalUser;

    return (
      <tr>
        <td onClick={onClick}>
          <FormControl
            checked={isChecked}
            componentClass="checkbox"
            onChange={onChange}
          />
        </td>
        <td>{firstName}</td>
        <td>{lastName}</td>
        <td>{username}</td>
        <td>{email}</td>
        <td>{createdAt}</td>
      </tr>
    );
  }
}

export default Row;