import { IUserDocument } from '@erxes/common-types';

export type LogDesc = {
  [key: string]: any;
} & { name: any };

export interface ILogDataParams {
  type: string;
  description?: string;
  object: any;
  newData?: object;
  extraDesc?: object[];
  updatedDocument?: any;
  extraParams?: any;
}

interface IFinalLogParams extends ILogDataParams {
  action: string;
}

const LOG_ACTIONS = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
};

export interface IDescriptionParams {
  action: string;
  type: string;
  obj: any;
  updatedDocument?: any;
  extraParams?: any;
}

interface IDescriptions {
  description?: string;
  extraDesc?: LogDesc[];
}

interface ISubAfterMutations {
  [action: string]: {
    callBack: void;
  };
}
interface IAfterMutations {
  [type: string]: ISubAfterMutations[];
}

const callAfterMutations: IAfterMutations[] | {} = {};

export const callAfterMutation = async (
  params: IFinalLogParams,
  user: IUserDocument
) => {
  if (!callAfterMutations) {
    return;
  }

  const { type, action } = params;

  // not used type in plugins
  if (!callAfterMutations[type]) {
    return;
  }

  // not used this type's action in plugins
  if (!callAfterMutations[type][action]) {
    return;
  }

  try {
    for (const handler of callAfterMutations[type][action]) {
      await handler({}, params, {
        user,
        models: allModels,
        memoryStorage,
        graphqlPubsub,
        messageBroker
      });
    }
  } catch (e) {
    throw new Error(e.message);
  }
};

const gatherDescriptions = async (
  descriptionHelper: (
    params: IDescriptionParams
  ) => { extraDesc: LogDesc[]; description: string },
  params: IDescriptionParams
): Promise<IDescriptions> => {
  const { extraDesc, description } = await descriptionHelper(params);

  return { extraDesc, description };
};

export const putCreateLog = async (
  messageBroker,
  descriptionHelper: (
    params: IDescriptionParams
  ) => { extraDesc: LogDesc[]; description: string },
  params: ILogDataParams,
  user: IUserDocument
) => {
  const descriptions = await gatherDescriptions(descriptionHelper, {
    action: LOG_ACTIONS.CREATE,
    type: params.type,
    obj: params.object,
    extraParams: params.extraParams,
  });

  return putLog(
    messageBroker,
    {
      ...params,
      action: LOG_ACTIONS.CREATE,
      extraDesc: descriptions.extraDesc,
      description: params.description || descriptions.description,
    },
    user
  );
};

/**
 * Prepares a create log request to log server
 * @param params Log document params
 * @param user User information from mutation context
 */
export const putUpdateLog = async (
  messageBroker,
  descriptionHelper: (
    params: IDescriptionParams
  ) => { extraDesc: LogDesc[]; description: string },
  params: ILogDataParams,
  user: IUserDocument
) => {
  const descriptions = await gatherDescriptions(descriptionHelper, {
    action: LOG_ACTIONS.UPDATE,
    type: params.type,
    obj: params.object,
    updatedDocument: params.updatedDocument,
    extraParams: params.extraParams,
  });

  return putLog(
    messageBroker,
    {
      ...params,
      action: LOG_ACTIONS.UPDATE,
      description: params.description || descriptions.description,
      extraDesc: descriptions.extraDesc,
    },
    user
  );
};

/**
 * Prepares a create log request to log server
 * @param params Log document params
 * @param user User information from mutation context
 */
export const putDeleteLog = async (
  messageBroker,
  descriptionHelper: (
    params: IDescriptionParams
  ) => { extraDesc: LogDesc[]; description: string },
  params: ILogDataParams,
  user: IUserDocument
) => {
  const descriptions = await gatherDescriptions(descriptionHelper, {
    action: LOG_ACTIONS.DELETE,
    type: params.type,
    obj: params.object,
    extraParams: params.extraParams,
  });

  return putLog(
    messageBroker,
    {
      ...params,
      action: LOG_ACTIONS.DELETE,
      extraDesc: descriptions.extraDesc,
      description: params.description || descriptions.description,
    },
    user
  );
};

const putLog = async (
  messageBroker,
  params: IFinalLogParams,
  user: IUserDocument
) => {
  try {
    return messageBroker().sendMessage('putLog', {
      ...params,
      createdBy: user._id,
      unicode: user.username || user.email || user._id,
      object: JSON.stringify(params.object),
      newData: JSON.stringify(params.newData),
      extraDesc: JSON.stringify(params.extraDesc),
    });
  } catch (e) {
    return e.message;
  }
};