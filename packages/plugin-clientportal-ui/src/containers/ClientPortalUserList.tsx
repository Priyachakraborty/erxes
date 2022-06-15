import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import { Alert, withProps } from '@erxes/ui/src/utils';
import { generatePaginationParams } from '@erxes/ui/src/utils/router';
import React from 'react';
import { graphql } from 'react-apollo';
import Bulk from '@erxes/ui/src/components/Bulk';
import { IRouterProps } from '@erxes/ui/src/types';
import { mutations, queries } from '../graphql';
import ClientPortalUserList from '../components/list/ClientPortalUserList';
import {
  ClientPortalUsersQueryResponse,
  ClientPortalUserTotalCountQueryResponse,
  ClientPortalUserRemoveMutationResponse
} from '../types';

type Props = {
  queryParams: any;
  history: any;
  type?: string;
};

type FinalProps = {
  clientPortalUsersQuery: ClientPortalUsersQueryResponse;
  clientPortalUserTotalCountQuery: ClientPortalUserTotalCountQueryResponse;
} & Props &
  ClientPortalUserRemoveMutationResponse &
  IRouterProps;

class ClientportalUserListContainer extends React.Component<FinalProps> {
  render() {
    const {
      clientPortalUsersQuery,
      clientPortalUsersRemove,
      type,
      history,
      queryParams,
      clientPortalUserTotalCountQuery
    } = this.props;

    const removeCustomers = ({ clientPortalUserIds }, emptyBulk) => {
      clientPortalUsersRemove({
        variables: { clientPortalUserIds }
      })
        .then(() => {
          emptyBulk();
          Alert.success(
            'You successfully deleted a user. The changes will take a few seconds',
            4500
          );
        })
        .catch(e => {
          Alert.error(e.message);
        });
    };

    const clientPortalUsers = clientPortalUsersQuery.clientPortalUsers || [];

    const searchValue = this.props.queryParams.searchValue || '';

    const updatedProps = {
      ...this.props,
      clientPortalUsers,
      clientPortalUserCount:
        clientPortalUserTotalCountQuery.clientPortalUserCounts || 0,
      searchValue,
      queryParams,
      loading: clientPortalUsersQuery.loading,
      removeCustomers
    };

    const content = props => {
      return <ClientPortalUserList {...updatedProps} {...props} />;
    };

    const refetch = () => {
      this.props.clientPortalUsersQuery.refetch();
    };

    return (
      <Bulk
        content={content}
        refetch={this.props.clientPortalUsersQuery.refetch}
      />
    );
  }
}

const getRefetchQueries = () => {
  return ['clientPortalUserCounts', 'clientPortalUsers'];
};

const options = () => ({
  refetchQueries: getRefetchQueries()
});

export default withProps<Props>(
  compose(
    graphql<
      Props,
      ClientPortalUsersQueryResponse,
      { page: number; perPage: number }
    >(gql(queries.clientPortalUsers), {
      name: 'clientPortalUsersQuery',
      options: ({ queryParams }) => ({
        variables: {
          searchValue: queryParams.searchValue,
          ...generatePaginationParams(queryParams)
        },
        fetchPolicy: 'network-only'
      })
    }),
    graphql<Props, ClientPortalUserTotalCountQueryResponse>(
      gql(queries.clientPortalUserCounts),
      {
        name: 'clientPortalUserTotalCountQuery',
        options: () => ({
          fetchPolicy: 'network-only'
        })
      }
    )
  )(ClientportalUserListContainer)
);