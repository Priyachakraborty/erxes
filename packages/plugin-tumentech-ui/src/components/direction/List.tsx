import Button from '@erxes/ui/src/components/Button';
import DataWithLoader from '@erxes/ui/src/components/DataWithLoader';
import EmptyContent from '@erxes/ui/src/components/empty/EmptyContent';
import FormControl from '@erxes/ui/src/components/form/Control';
import Pagination from '@erxes/ui/src/components/pagination/Pagination';
import SortHandler from '@erxes/ui/src/components/SortHandler';
import Table from '@erxes/ui/src/components/table';
import { __ } from 'coreui/utils';
import Wrapper from '@erxes/ui/src/layout/components/Wrapper';
import { BarItems } from '@erxes/ui/src/layout/styles';
import { EMPTY_CONTENT_POPUPS } from '@erxes/ui-settings/src/constants';
import TaggerPopover from '@erxes/ui/src/tags/components/TaggerPopover';
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ITag } from '@erxes/ui/src/tags/types';
import { ILeadIntegration, IntegrationsCount } from '@erxes/ui-leads/src/types';
import Row from './Row';
import { TAG_TYPES } from '@erxes/ui/src/tags/constants';
import { isEnabled } from '@erxes/ui/src/utils/core';

type Props = {
  directions: any[];
  tags: ITag[];
  bulk: ILeadIntegration[];
  isAllSelected: boolean;
  emptyBulk: () => void;
  totalCount: number;
  queryParams: any;
  tagsCount: { [key: string]: number };
  toggleBulk: (target: ILeadIntegration, toAdd: boolean) => void;
  toggleAll: (bulk: ILeadIntegration[], name: string) => void;
  loading: boolean;
  remove: (integrationId: string) => void;
  archive: (integrationId: string, status: boolean) => void;
  refetch?: () => void;
  copy: (integrationId: string) => void;
  counts: IntegrationsCount;
};

const List = (props: Props) => {
  const {
    totalCount,
    queryParams,
    loading,
    bulk,
    emptyBulk,
    isAllSelected,
    directions,
    counts
  } = props;

  const onChange = () => {
    const { toggleAll, directions } = props;
    toggleAll(directions, 'integrations');
  };

  const renderRow = () => {
    const { directions } = props;
    return directions.map(direction => (
      <Row key={direction._id} direction={direction} />
    ));
  };

  queryParams.loadingMainQuery = loading;
  let actionBarLeft: React.ReactNode;

  if (bulk.length > 0) {
    const tagButton = (
      <Button btnStyle="simple" size="small" icon="tag-alt">
        Tag
      </Button>
    );
    actionBarLeft = (
      <BarItems>
        {isEnabled('tags') && (
          <TaggerPopover
            type={TAG_TYPES.INTEGRATION}
            successCallback={emptyBulk}
            targets={bulk}
            trigger={tagButton}
          />
        )}
      </BarItems>
    );
  }

  const actionBarRight = (
    <Link to="/forms/create">
      <Button btnStyle="success" size="small" icon="plus-circle">
        Create Form
      </Button>
    </Link>
  );
  const actionBar = (
    <Wrapper.ActionBar right={actionBarRight} left={actionBarLeft} />
  );
  const content = (
    <Table whiteSpace="nowrap" hover={true}>
      <thead>
        <tr>
          <th>
            <FormControl
              componentClass="checkbox"
              checked={isAllSelected}
              onChange={onChange}
            />
          </th>
          <th>
            <SortHandler sortField={'name'} label={__('Name')} />
          </th>
          <th>{__('Status')}</th>
          <th>
            <SortHandler sortField={'leadData.viewCount'} label={__('Views')} />
          </th>
          <th>
            <SortHandler
              sortField={'leadData.conversionRate'}
              label={__('Conversion rate')}
            />
          </th>
          <th>
            <SortHandler
              sortField={'leadData.contactsGathered'}
              label={__('Contacts gathered')}
            />
          </th>
          <th>{__('Brand')}</th>
          <th>{__('Created by')}</th>
          <th>
            <SortHandler sortField={'createdDate'} label={__('Created at')} />
          </th>
          {isEnabled('tags') && <th>{__('Tags')}</th>}
          <th>{__('Actions')}</th>
        </tr>
      </thead>
      <tbody>{renderRow()}</tbody>
    </Table>
  );
  return (
    <Wrapper
      header={
        <Wrapper.Header
          title={__('Forms')}
          breadcrumb={[
            {
              title: __('Forms')
            }
          ]}
          queryParams={queryParams}
        />
      }
      actionBar={actionBar}
      footer={<Pagination count={totalCount} />}
      content={
        <DataWithLoader
          data={content}
          loading={loading}
          count={directions.length}
          emptyContent={
            <EmptyContent content={EMPTY_CONTENT_POPUPS} maxItemWidth="360px" />
          }
        />
      }
    />
  );
};

export default List;
