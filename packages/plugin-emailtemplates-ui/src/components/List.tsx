import HeaderDescription from '@erxes/ui/src/components/HeaderDescription';
import Icon from '@erxes/ui/src/components/Icon';
import ModalTrigger from '@erxes/ui/src/components/ModalTrigger';
import { IButtonMutateProps } from '@erxes/ui/src/types';
import { __ } from '@erxes/ui/src/utils';
import React from 'react';
import List from '@erxes/ui-settings/src/common/components/List';
import { ICommonListProps } from '@erxes/ui-settings/src/common/types';
import {
  Actions,
  IframePreview,
  Template,
  TemplateBox,
  Templates,
  TemplateInfo,
  Divider
} from '../styles';
import Form from './Form';
import { EMAIL_TEMPLATE_STATUSES, EMAIL_TEMPLATE_TIPTEXT } from '../constants';
import Tip from '@erxes/ui/src/components/Tip';
import FormControl from '@erxes/ui/src/components/form/Control';
import { router } from 'coreui/utils';
import dayjs from 'dayjs';

type Props = {
  queryParams: any;
  history: any;
  renderButton: (props: IButtonMutateProps) => JSX.Element;
  changeStatus: (_id: string, status: string) => void;
  duplicate: (id: string) => void;
} & ICommonListProps;

type State = {
  items: any;
  searchValue: string;
};

class EmailTemplateList extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      items: props.objects,
      searchValue: ''
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.objects !== this.props.objects) {
      this.setState({ items: nextProps.objects });
    }
  }

  renderForm = props => {
    return <Form {...props} renderButton={this.props.renderButton} />;
  };

  renderDisableAction = object => {
    const { changeStatus } = this.props;
    const _id = object._id;
    const isActive =
      object.status === null ||
      object.status === EMAIL_TEMPLATE_STATUSES.ACTIVE;
    const icon = isActive ? 'archive-alt' : 'redo';

    const status = isActive
      ? EMAIL_TEMPLATE_STATUSES.ARCHIVED
      : EMAIL_TEMPLATE_STATUSES.ACTIVE;

    const text = isActive
      ? EMAIL_TEMPLATE_TIPTEXT.ARCHIVED
      : EMAIL_TEMPLATE_TIPTEXT.ACTIVE;

    if (!changeStatus) {
      return null;
    }

    const onClick = () => changeStatus(_id, status);

    return (
      <div onClick={onClick}>
        <Icon icon={icon} /> {text}
      </div>
    );
  };

  removeTemplate = object => {
    this.props.remove(object._id);
  };

  duplicateTemplate = id => {
    this.props.duplicate(id);
  };

  renderEditAction = object => {
    const { save } = this.props;

    const content = props => {
      return this.renderForm({ ...props, object, save });
    };

    return (
      <ModalTrigger
        enforceFocus={false}
        title="Edit"
        size="lg"
        trigger={
          <div>
            <Icon icon="edit" /> Edit
          </div>
        }
        content={content}
      />
    );
  };

  renderDuplicateAction(object) {
    return (
      <div onClick={this.duplicateTemplate.bind(this, object._id)}>
        <Icon icon="copy-1" />
        Duplicate
      </div>
    );
  }

  renderRow = () => {
    return this.state.items.map((object, index) => (
      <Template key={index}>
        <TemplateBox>
          <Actions>
            {this.renderEditAction(object)}
            <div onClick={this.removeTemplate.bind(this, object)}>
              <Icon icon="cancel-1" /> Delete
            </div>
            {this.renderDisableAction(object)}
            {this.renderDuplicateAction(object)}
          </Actions>
          <IframePreview>
            <iframe title="content-iframe" srcDoc={object.content} />
          </IframePreview>
        </TemplateBox>
        <h5>{object.name}</h5>
        <Divider />
        <TemplateInfo>
          <p>
            {object.createdAt === object.modifiedAt
              ? `Created at:`
              : `Modified at:`}
          </p>
          <p>
            {object.createdAt === object.modifiedAt
              ? `${dayjs(object.createdAt).format('DD MMM YYYY')}`
              : `${dayjs(object.modifiedAt).format('DD MMM YYYY')}`}
          </p>
        </TemplateInfo>
        {object.createdUser && (
          <TemplateInfo>
            <p>Created by:</p>
            {object.createdUser.details.fullName && (
              <p>{object.createdUser.details.fullName}</p>
            )}
          </TemplateInfo>
        )}
      </Template>
    ));
  };

  searchHandler = event => {
    const searchValue = event.target.value.toLowerCase();
    const { history, objects } = this.props;

    router.setParams(history, { searchValue: event.target.value });

    let updatedObjects = objects;

    if (searchValue) {
      updatedObjects = objects.filter(p =>
        p.name.toLowerCase().includes(searchValue)
      );
    }

    this.setState({ items: updatedObjects });
  };

  renderContent = () => {
    return <Templates>{this.renderRow()}</Templates>;
  };

  render() {
    return (
      <List
        formTitle="New email template"
        size="lg"
        breadcrumb={[
          { title: __('Settings'), link: '/settings' },
          { title: __('Email templates') }
        ]}
        title={__('Email templates')}
        leftActionBar={
          <HeaderDescription
            icon="/images/actions/22.svg"
            title="Email templates"
            description={`${__(
              `It's all about thinking ahead for your customers`
            )}.${__(
              'Team members will be able to choose from email templates and send out one message to multiple recipients'
            )}.${__(
              'You can use the email templates to send out a Mass email for leads/customers or you can send to other team members'
            )}`}
          />
        }
        renderForm={this.renderForm}
        renderContent={this.renderContent}
        {...this.props}
        queryParams={this.props.queryParams}
        history={this.props.history}
        additionalButton={
          <FormControl
            type="text"
            placeholder={__('Type to search')}
            onChange={this.searchHandler}
            value={router.getParam(this.props.history, 'searchValue')}
            autoFocus={true}
          />
        }
      />
    );
  }
}

export default EmailTemplateList;
