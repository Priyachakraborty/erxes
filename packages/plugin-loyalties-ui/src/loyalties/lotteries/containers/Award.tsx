import { Bulk } from '@erxes/ui/src/components';
import { IRouterProps } from '@erxes/ui/src/types';
import { router, withProps } from '@erxes/ui/src/utils';
import gql from 'graphql-tag';
import * as compose from 'lodash.flowright';
import React from 'react';
import { graphql } from 'react-apollo';
import { withRouter } from 'react-router-dom';
import { queries } from '../../../configs/lotteryCampaign/graphql';
import { LotteryCampaignDetailQueryResponse } from '../../../configs/lotteryCampaign/types';
import { queries as VoucherQuery } from '../../../configs/voucherCampaign/graphql';
import { VoucherCampaignDetailQueryResponse } from '../../../configs/voucherCampaign/types';
import VoucherAward from '../components/Award';
import { lotteriesCampaignMain } from '../graphql/queries';
import { MainQueryResponse, RemoveMutationResponse } from '../types';

type Props = { history: any; queryParams: any; voucherCampaignId: string };
type FinalProps = {
  VoucherCampaignDetailQueryResponse: LotteryCampaignDetailQueryResponse;
  voucherCampaignDetailQuery: VoucherCampaignDetailQueryResponse;
  voucherCampaignDetail: any;
  doLottery: any;
  // lotteryCampaignWinnerList: any;
  multipledoLottery: any;
} & Props &
  IRouterProps &
  RemoveMutationResponse;

type State = {
  loading: boolean;
  voucherDetail: Object;
};
class AwardContainer extends React.Component<FinalProps, State> {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      voucherDetail: {}
    };
    this.voucherDetail = this.voucherDetail.bind(this);
    this.doLotteries = this.doLotteries.bind(this);
  }
  voucherDetail(variables: any) {
    this.props.voucherCampaignDetail
      .refetch({
        _id: variables
      })
      .then(res => {
        const { voucherCampaignDetail } = res.data;
        this.setState({ voucherDetail: voucherCampaignDetail });
      });
  }
  doLotteries(variables: any) {
    this.props.doLottery({ variables }).then(() => {
      // this.props.lotteryCampaignWinnerList.refetch();
    });
  }

  render() {
    const updatedProps = {
      ...this.props,
      voucherDetail: this.state.voucherDetail,
      loadVoucherCampaingDetail: this.voucherDetail,
      doLotteries: this.doLotteries
    };

    const refetch = () => {
      this.props.voucherCampaignDetail.refetch();
    };

    const list = props => {
      return <VoucherAward {...updatedProps} {...props} />;
    };

    return <Bulk content={list} refetch={refetch} />;
  }
}

const generateParams = ({ queryParams }) => ({
  ...router.generatePaginationParams(queryParams || {}),
  ids: queryParams.ids,
  campaignId: queryParams.campaignId,
  status: queryParams.status,
  ownerId: queryParams.ownerId,
  ownerType: queryParams.ownerType,
  searchValue: queryParams.searchValue,
  sortField: queryParams.sortField,
  sortDirection: Number(queryParams.sortDirection) || undefined,
  voucherCampaignId: queryParams.voucherCampaignId
});

export default withProps<Props>(
  compose(
    graphql<Props, LotteryCampaignDetailQueryResponse>(
      gql(queries.lotteryCampaignDetail),
      {
        name: 'lotteryCampaignDetailQuery',
        options: ({ queryParams }) => ({
          variables: {
            _id: queryParams.campaignId
          }
        }),
        skip: ({ queryParams }) => !queryParams.campaignId
      }
    ),
    graphql<Props, LotteryCampaignDetailQueryResponse>(
      gql(VoucherQuery.voucherCampaignDetail),
      {
        name: 'voucherCampaignDetail',
        options: ({ voucherCampaignId }) => ({
          variables: {
            _id: voucherCampaignId
          }
        })
      }
    ),
    graphql<{ queryParams: any }, MainQueryResponse>(
      gql(lotteriesCampaignMain),
      {
        name: 'lotteriesCampaignCustomerList',
        options: ({ queryParams }) => ({
          variables: generateParams({ queryParams }),
          fetchPolicy: 'network-only'
        })
      }
    )
  )(withRouter<IRouterProps>(AwardContainer))
);