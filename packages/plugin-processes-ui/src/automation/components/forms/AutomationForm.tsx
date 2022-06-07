import { __, Alert } from 'coreui/utils';
import { jsPlumb } from 'jsplumb';
import jquery from 'jquery';
import RTG from 'react-transition-group';
import Wrapper from '@erxes/ui/src/layout/components/Wrapper';
import React from 'react';
import {
  Container,
  BackButton,
  Title,
  RightDrawerContainer,
  AutomationFormContainer,
  BackIcon,
  CenterBar,
  ToggleWrapper,
  ZoomActions,
  ZoomIcon,
  ActionBarButtonsWrapper
} from '../../styles';
import { FormControl } from '@erxes/ui/src/components/form';
import { BarItems, HeightedWrapper } from '@erxes/ui/src/layout/styles';
import Button from '@erxes/ui/src/components/Button';
import ActionsForm from '../../containers/forms/actions/ActionsForm';
import {
  createInitialConnections,
  deleteConnection,
  sourceEndpoint,
  targetEndpoint,
  connectorPaintStyle,
  connectorHoverStyle,
  hoverPaintStyle,
  connection
} from '../../utils';
import JobForm from './actions/subForms/CustomCode';
import Icon from '@erxes/ui/src/components/Icon';
import PageContent from '@erxes/ui/src/layout/components/PageContent';
import { Link } from 'react-router-dom';
import { Tabs, TabTitle } from '@erxes/ui/src/components/tabs';
import Toggle from '@erxes/ui/src/components/Toggle';
import Confirmation from '../../containers/forms/Confirmation';
import { FlexContent } from '@erxes/ui/src/activityLogs/styles';
import { IFlowDocument, IJob } from '../../../flow/types';
import { IJobRefer } from '../../../job/types';

const plumb: any = jsPlumb;
let instance;

type Props = {
  automation: IFlowDocument;
  jobRefers: IJobRefer[];
  save: (params: any) => void;
  saveLoading: boolean;
  id: string;
  history: any;
  queryParams: any;
};

type State = {
  name: string;
  currentTab: string;
  activeId: string;
  showDrawer: boolean;
  showTrigger: boolean;
  showAction: boolean;
  isActionTab: boolean;
  isActive: boolean;
  showNoteForm: boolean;
  editNoteForm?: boolean;
  showTemplateForm: boolean;
  actions: IJob[];
  activeAction: IJob;
  selectedContentId?: string;
  isZoomable: boolean;
  zoomStep: number;
  zoom: number;
  percentage: number;
};

class AutomationForm extends React.Component<Props, State> {
  private wrapperRef;
  private setZoom;

  constructor(props) {
    super(props);

    const { automation } = this.props;
    const lenAutomation = Object.keys(automation);

    this.state = {
      name: lenAutomation.length ? automation.name : 'Your flow title',
      actions: JSON.parse(
        JSON.stringify(lenAutomation.length ? automation.jobs : [])
      ),
      activeId: '',
      currentTab: 'actions',
      isActionTab: true,
      isActive: lenAutomation.length ? automation.status === 'active' : false,
      showNoteForm: false,
      showTemplateForm: false,
      showTrigger: false,
      showDrawer: false,
      showAction: false,
      isZoomable: false,
      zoomStep: 0.025,
      zoom: 1,
      percentage: 100,
      activeAction: {} as IJob
    };
  }

  setWrapperRef = node => {
    this.wrapperRef = node;
  };

  componentDidMount() {
    this.connectInstance();

    document.addEventListener('click', this.handleClickOutside, true);
  }

  componentDidUpdate(prevProps, prevState) {
    const { isActionTab } = this.state;

    if (isActionTab && isActionTab !== prevState.isActionTab) {
      this.connectInstance();
    }

    this.setZoom = (zoom, instanceZoom, transformOrigin, el) => {
      transformOrigin = transformOrigin || [0.5, 0.5];
      instanceZoom = instanceZoom || jsPlumb;
      el = el || instanceZoom.getContainer();

      const p = ['webkit', 'moz', 'ms', 'o'];
      const s = 'scale(' + zoom + ')';
      const oString =
        transformOrigin[0] * 100 + '% ' + transformOrigin[1] * 100 + '%';

      // tslint:disable-next-line:prefer-for-of
      for (let i = 0; i < p.length; i++) {
        el.style[p[i] + 'Transform'] = s;
        el.style[p[i] + 'TransformOrigin'] = oString;
      }

      el.style.transform = s;
      el.style.transformOrigin = oString;

      instanceZoom.setZoom(zoom);
    };
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.handleClickOutside, true);
  }

  connectInstance = () => {
    instance = plumb.getInstance({
      DragOptions: { cursor: 'pointer', zIndex: 2000 },
      PaintStyle: connectorPaintStyle,
      HoverPaintStyle: connectorHoverStyle,
      EndpointStyle: { radius: 10 },
      EndpointHoverStyle: hoverPaintStyle,
      Container: 'canvas'
    });

    const { actions } = this.state;

    instance.bind('ready', () => {
      instance.bind('connection', info => {
        this.onConnection(info);
      });

      instance.bind('connectionDetached', info => {
        this.onDettachConnection(info);
      });
      for (const action of actions) {
        this.renderControl('action', action, this.onClickAction);
      }

      // create connections ===================
      createInitialConnections(actions, instance);

      // delete connections ===================
      deleteConnection(instance);
    });

    // hover action control ===================
    jquery('#canvas .control').hover(event => {
      event.preventDefault();

      jquery(`div#${event.currentTarget.id}`).toggleClass('show-action-menu');

      this.setState({ activeId: event.currentTarget.id });
    });

    // delete control ===================
    jquery('#canvas').on('click', '.delete-control', event => {
      event.preventDefault();

      const item = event.currentTarget.id;
      const splitItem = item.split('-');
      const type = splitItem[0];

      instance.remove(item);

      if (type === 'action') {
        return this.setState({
          actions: actions.filter(action => action.id !== splitItem[1])
        });
      }
    });
  };

  handleSubmit = () => {
    const { name, isActive, actions } = this.state;
    const { automation, save } = this.props;

    if (!name || name === 'Your flow title') {
      return Alert.error('Enter an Flow title');
    }

    const generateValues = () => {
      const finalValues = {
        _id: automation._id || '',
        name,
        status: isActive ? 'active' : 'draft',
        jobs: actions.map(a => ({
          id: a.id,
          nextJobIds: a.nextJobIds,
          jobReferId: a.jobReferId,
          label: a.label,
          description: a.description,
          style: jquery(`#action-${a.id}`).attr('style')
        }))
      };

      return finalValues;
    };

    return save(generateValues());
  };

  handleNoteModal = (item?) => {
    this.setState({
      showNoteForm: !this.state.showNoteForm,
      editNoteForm: item ? true : false
    });
  };

  handleTemplateModal = () => {
    this.setState({ showTemplateForm: !this.state.showTemplateForm });
  };

  switchActionbarTab = type => {
    this.setState({ isActionTab: type === 'action' ? true : false });
  };

  onToggle = e => {
    const isActive = e.target.checked;

    this.setState({ isActive });

    const { save, automation } = this.props;

    if (Object.keys(automation).length) {
      save({ _id: automation._id, status: isActive ? 'active' : 'draft' });
    }
  };

  doZoom = (step: number, inRange: boolean) => {
    const { isZoomable, zoom } = this.state;

    if (inRange) {
      this.setState({ zoom: zoom + step });
      this.setZoom(zoom, jsPlumb, null, jquery('#canvas')[0]);

      if (isZoomable) {
        this.setState({ zoom: zoom + step });
        setTimeout(() => this.doZoom(step, inRange), 100);
      }
    }
  };

  onZoom = (type: string) => {
    const { zoomStep, zoom, percentage } = this.state;

    this.setState({ isZoomable: true }, () => {
      let step = 0 - zoomStep;
      const max = zoom <= 1;
      const min = zoom >= 0.399;

      if (type === 'zoomIn') {
        step = +zoomStep;

        this.doZoom(step, max);
        this.setState({ percentage: max ? percentage + 10 : 100 });
      }

      if (type === 'zoomOut') {
        this.doZoom(step, min);
        this.setState({ percentage: min ? percentage - 10 : 0 });
      }
    });
  };

  onClickAction = (action: IJob) => {
    this.setState({
      showAction: true,
      showDrawer: true,
      showTrigger: false,
      currentTab: 'actions',
      activeAction: action ? action : ({} as IJob)
    });

    console.log('automationForm onClickAction:', action);
  };

  onConnection = info => {
    const { actions } = this.state;

    connection(actions, info, info.targetId.replace('action-', ''));

    this.setState({ actions });
  };

  onDettachConnection = info => {
    const { actions } = this.state;

    connection(actions, info, undefined);

    this.setState({ actions });
  };

  handleClickOutside = event => {
    if (
      this.wrapperRef &&
      !this.wrapperRef.contains(event.target) &&
      this.state.isActionTab
    ) {
      this.setState({ showDrawer: false });
    }
  };

  toggleDrawer = (type: string) => {
    this.setState({
      showDrawer: !this.state.showDrawer,
      currentTab: type,
      activeAction: {} as IJob
    });
  };

  getNewId = (checkIds: string[]) => {
    let newId = Math.random()
      .toString(36)
      .slice(-8);

    if (checkIds.includes(newId)) {
      newId = this.getNewId(checkIds);
    }

    return newId;
  };

  addAction = (
    data?: IJob,
    actionId?: string,
    jobReferId?: string,
    description?: string
  ) => {
    const { actions } = this.state;
    const { jobRefers } = this.props;

    console.log('addAction start: ');

    let action: any = { ...data, id: this.getNewId(actions.map(a => a.id)) };

    let actionIndex = -1;

    console.log('addAction step1');

    if (actionId) {
      actionIndex = actions.findIndex(a => a.id === actionId);

      if (actionIndex !== -1) {
        action = actions[actionIndex];
      }
    }

    console.log('addAction step2');

    action.jobReferId = jobReferId;

    const jobRefer = jobRefers.find(j => j._id === jobReferId);

    action.label = jobRefer.name;
    action.description = description || jobRefer.name;

    if (actionIndex !== -1) {
      actions[actionIndex] = action;
    } else {
      actions.push(action);
    }

    console.log('addAction step3');

    this.setState({ actions, activeAction: action }, () => {
      if (!actionId) {
        this.renderControl('action', action, this.onClickAction);
      }
    });

    console.log('addAction step4');
  };

  onNameChange = (e: React.FormEvent<HTMLElement>) => {
    const value = (e.currentTarget as HTMLButtonElement).value;
    this.setState({ name: value });
  };

  renderControl = (key: string, item: IJob, onClick: any) => {
    const idElm = `${key}-${item.id}`;

    console.log('renderControl: ', idElm);

    jquery('#canvas').append(`
      <div class="${key} control" id="${idElm}" style="${item.style}">
        <div class="trigger-header">
          <div class='custom-menu'>
            <div>
              <i class="icon-trash-alt delete-control" id="${idElm}" title=${__(
      'Delete control one'
    )}></i>
            </div>
          </div>
          <div>
            <i class="icon-2"></i>
            ${item.label}
          </div>
        </div>
        <p>${item.description}</p>

      </div>
    `);

    console.log('renderControl step1');

    jquery('#canvas').on('dblclick', `#${idElm}`, event => {
      event.preventDefault();

      onClick(item);
    });

    console.log('renderControl step2');

    if (key === 'action') {
      console.log('renderControl step3.1');

      instance.addEndpoint(idElm, targetEndpoint, {
        anchor: ['Left']
      });

      console.log('renderControl step3.2');

      instance.addEndpoint(idElm, sourceEndpoint, {
        anchor: ['Right']
      });

      console.log('renderControl step3.3');

      instance.draggable(instance.getSelector(`#${idElm}`));

      console.log('renderControl step3.4');
    }

    console.log('renderControl step4');
  };

  renderButtons() {
    if (!this.state.isActionTab) {
      return null;
    }

    return (
      <>
        <Button
          btnStyle="primary"
          size="small"
          icon="plus-circle"
          onClick={this.toggleDrawer.bind(this, 'actions')}
        >
          Add a Job
        </Button>
      </>
    );
  }

  rendeRightActionBar() {
    const { isActive } = this.state;

    return (
      <BarItems>
        <ToggleWrapper>
          <span className={isActive ? 'active' : ''}>{__('Inactive')}</span>
          <Toggle defaultChecked={isActive} onChange={this.onToggle} />
          <span className={!isActive ? 'active' : ''}>{__('Active')}</span>
        </ToggleWrapper>
        <ActionBarButtonsWrapper>
          {this.renderButtons()}
          <Button
            btnStyle="success"
            size="small"
            icon={'check-circle'}
            onClick={this.handleSubmit}
          >
            {__('Save')}
          </Button>
        </ActionBarButtonsWrapper>
      </BarItems>
    );
  }

  renderLeftActionBar() {
    const { isActionTab, name } = this.state;

    return (
      <FlexContent>
        <Link to={`/processes/Flows`}>
          <BackButton>
            <Icon icon="angle-left" size={20} />
          </BackButton>
        </Link>
        <Title>
          <FormControl
            name="name"
            value={name}
            onChange={this.onNameChange}
            required={true}
            autoFocus={true}
          />
          <Icon icon="edit-alt" size={16} />
        </Title>
        <CenterBar>
          <Tabs full={true}>
            <TabTitle
              className={isActionTab ? 'active' : ''}
              onClick={this.switchActionbarTab.bind(this, 'action')}
            >
              {__('Actions')}
            </TabTitle>
          </Tabs>
        </CenterBar>
      </FlexContent>
    );
  }

  onBackAction = () => this.setState({ showAction: false });

  onSave = () => {
    const { activeAction } = this.state;

    this.addAction(activeAction);

    this.onBackAction();
  };

  renderTabContent() {
    const { currentTab, showAction, activeAction } = this.state;

    if (currentTab === 'actions') {
      const { actions } = this.state;

      console.log('actions: ', actions);

      if (showAction && activeAction) {
        return (
          <>
            <JobForm
              activeAction={activeAction}
              addAction={this.addAction}
              closeModal={this.onBackAction}
              jobRefers={this.props.jobRefers}
              actions={actions}
              onSave={this.onSave}
            />
          </>
        );
      }

      return <ActionsForm onClickAction={this.onClickAction} />;
    }

    return null;
  }

  renderZoomActions() {
    return (
      <ZoomActions>
        <div className="icon-wrapper">
          <ZoomIcon
            disabled={this.state.zoom >= 1}
            onMouseDown={this.onZoom.bind(this, 'zoomIn')}
            onMouseUp={() => this.setState({ isZoomable: false })}
          >
            <Icon icon="plus" />
          </ZoomIcon>
          <ZoomIcon
            disabled={this.state.zoom <= 0.399}
            onMouseDown={this.onZoom.bind(this, 'zoomOut')}
            onMouseUp={() => this.setState({ isZoomable: false })}
          >
            <Icon icon="minus" />{' '}
          </ZoomIcon>
        </div>
        <span>{`${this.state.percentage}%`}</span>
      </ZoomActions>
    );
  }

  renderContent() {
    const { actions } = this.state;

    if (actions.length === 0) {
      return (
        <Container>
          <div
            className="trigger scratch"
            onClick={this.toggleDrawer.bind(this, 'actions')}
          >
            <Icon icon="file-plus" size={25} />
            <p>{__('Please add first job')}?</p>
          </div>
        </Container>
      );
    }

    return (
      <Container>
        {this.renderZoomActions()}
        <div id="canvas" />
      </Container>
    );
  }

  renderConfirmation() {
    const { id, queryParams, history, saveLoading, automation } = this.props;
    const { actions, name } = this.state;

    if (saveLoading) {
      return null;
    }

    const when = queryParams.isCreate
      ? !!id
      : JSON.stringify(actions) !== JSON.stringify([]) ||
        automation.name !== this.state.name;

    return (
      <Confirmation
        when={when}
        id={id}
        name={name}
        save={this.handleSubmit}
        history={history}
        queryParams={queryParams}
      />
    );
  }

  render() {
    const { automation } = this.props;

    const { jobRefers } = this.props;
    console.log('jobRefers on automationForm:', jobRefers);

    return (
      <>
        {this.renderConfirmation()}
        <HeightedWrapper>
          <AutomationFormContainer>
            <Wrapper.Header
              title={`${(automation && automation.name) || 'Automation'}`}
              breadcrumb={[
                { title: __('Flows'), link: '/processes/Flows' },
                { title: `${(automation && automation.name) || 'New Form'}` }
              ]}
            />
            <PageContent
              actionBar={
                <Wrapper.ActionBar
                  left={this.renderLeftActionBar()}
                  right={this.rendeRightActionBar()}
                />
              }
              transparent={false}
            >
              {this.renderContent()}
            </PageContent>
          </AutomationFormContainer>

          <div ref={this.setWrapperRef}>
            <RTG.CSSTransition
              in={this.state.showDrawer}
              timeout={300}
              classNames="slide-in-right"
              unmountOnExit={true}
            >
              <RightDrawerContainer>
                {this.renderTabContent()}
              </RightDrawerContainer>
            </RTG.CSSTransition>
          </div>
        </HeightedWrapper>
      </>
    );
  }
}

export default AutomationForm;