import { Transform } from 'stream';

import { chunkArray } from '@erxes/api-utils/src/core';
import { generateFieldsFromSchema } from '@erxes/api-utils/src/fieldUtils';
import EditorAttributeUtil from '@erxes/api-utils/src/editorAttributeUtils';

import { debug, es } from './configs';
import { ICustomerDocument } from './models/definitions/customers';
import messageBroker, {
  sendCoreMessage,
  sendEngagesMessage,
  sendInboxMessage,
  sendTagsMessage
} from './messageBroker';
import { getService, getServices } from '@erxes/api-utils/src/serviceDiscovery'
import { generateModels, IModels } from './connectionResolver';

export const findCustomer = async ({ Customers }: IModels, doc) => {
  let customer;

  if (doc.customerPrimaryEmail) {
    customer = await Customers.findOne({
      $or: [
        { emails: { $in: [doc.customerPrimaryEmail] } },
        { primaryEmail: doc.customerPrimaryEmail }
      ]
    });
  }

  if (!customer && doc.customerPrimaryPhone) {
    customer = await Customers.findOne({
      $or: [
        { phones: { $in: [doc.customerPrimaryPhone] } },
        { primaryPhone: doc.customerPrimaryPhone }
      ]
    });
  }

  if (!customer && doc.customerCode) {
    customer = await Customers.findOne({ code: doc.customerCode });
  }

  if (!customer && doc._id) {
    customer = await Customers.findOne({ _id: doc._id });
  }

  if (!customer) {
    customer = await Customers.findOne(doc);
  }

  return customer;
};

export const findCompany = async ({ Companies }: IModels, doc) => {
  let company;

  if (doc.companyPrimaryName) {
    company = await Companies.findOne({
      $or: [
        { names: { $in: [doc.companyPrimaryName] } },
        { primaryName: doc.companyPrimaryName }
      ]
    });
  }

  if (!company && doc.name) {
    company = await Companies.findOne({
      $or: [{ names: { $in: [doc.name] } }, { primaryName: doc.name }]
    });
  }

  if (!company && doc.email) {
    company = await Companies.findOne({
      $or: [{ emails: { $in: [doc.email] } }, { primaryEmail: doc.email }]
    });
  }

  if (!company && doc.phone) {
    company = await Companies.findOne({
      $or: [{ phones: { $in: [doc.phone] } }, { primaryPhone: doc.phone }]
    });
  }

  if (!company && doc.companyPrimaryEmail) {
    company = await Companies.findOne({
      $or: [
        { emails: { $in: [doc.companyPrimaryEmail] } },
        { primaryEmail: doc.companyPrimaryEmail }
      ]
    });
  }

  if (!company && doc.companyPrimaryPhone) {
    company = await Companies.findOne({
      $or: [
        { phones: { $in: [doc.companyPrimaryPhone] } },
        { primaryPhone: doc.companyPrimaryPhone }
      ]
    });
  }

  if (!company && doc.companyCode) {
    company = await Companies.findOne({ code: doc.companyCode });
  }

  if (!company && doc._id) {
    company = await Companies.findOne({ _id: doc._id });
  }

  if (!company) {
    company = await Companies.findOne(doc);
  }

  return company;
};

const generateUsersOptions = async (
  name: string,
  label: string,
  type: string,
  subdomain: string
) => {
  const users = await sendCoreMessage({
    subdomain,
    action: 'users.find',
    data: {
      query: {}
    },
    isRPC: true
  });

  const options: Array<{ label: string; value: any }> = users.map(user => ({
    value: user._id,
    label: user.username || user.email || ''
  }));

  return {
    _id: Math.random(),
    name,
    label,
    type,
    selectOptions: options
  };
};

const getTags = async (type: string, subdomain: string) => {
  const tags = await sendTagsMessage({
    subdomain,
    action: 'find',
    data: {
      type
    },
    isRPC: true,
    defaultValue: []
  });

  return {
    _id: Math.random(),
    name: 'tagIds',
    label: 'Tag',
    type: 'tag',
    selectOptions: tags
  };
};

export const generateFields = async ({ subdomain, data }) => {
  const { type, usageType } = data;

  const models = await generateModels(subdomain);

  const { Customers, Companies } = models;

  let schema: any;
  let fields: Array<{
    _id: number;
    name: string;
    group?: string;
    label?: string;
    type?: string;
    validation?: string;
    options?: string[];
    selectOptions?: Array<{ label: string; value: string }>;
  }> = [];

  switch (type) {
    case 'lead':
      schema = Customers.schema;

    case 'customer':
      schema = Customers.schema;
      break;

    case 'company':
      schema = Companies.schema;
      break;
  }

  if (schema) {
    // generate list using customer or company schema
    fields = [...fields, ...(await generateFieldsFromSchema(schema, ''))];

    for (const name of Object.keys(schema.paths)) {
      const path = schema.paths[name];

      // extend fields list using sub schema fields
      if (path.schema) {
        fields = [
          ...fields,
          ...(await generateFieldsFromSchema(path.schema, `${name}.`))
        ];
      }
    }
  }

  if (!usageType || usageType === 'export') {
    const aggre = await es.fetchElk({
      action: 'search',
      index: type === 'company' ? 'companies' : 'customers',
      body: {
        size: 0,
        _source: false,
        aggs: {
          trackedDataKeys: {
            nested: {
              path: 'trackedData'
            },
            aggs: {
              fieldKeys: {
                terms: {
                  field: 'trackedData.field',
                  size: 10000
                }
              }
            }
          }
        }
      },
      defaultValue: { aggregations: { trackedDataKeys: {} } }
    });

    const aggregations = aggre.aggregations || { trackedDataKeys: {} };
    const buckets = (aggregations.trackedDataKeys.fieldKeys || { buckets: [] })
      .buckets;

    for (const bucket of buckets) {
      fields.push({
        _id: Math.random(),
        name: `trackedData.${bucket.key}`,
        label: bucket.key
      });
    }
  }

  const ownerOptions = await generateUsersOptions(
    'ownerId',
    'Owner',
    'user',
    subdomain
  );

  const tags = await getTags(type, subdomain);
  fields = [...fields, ...[tags]];

  if (type === 'customer') {
    const integrations = await sendInboxMessage({
      subdomain,
      action: 'integrations.find',
      data: {},
      isRPC: true
    });

    fields.push({
      _id: Math.random(),
      name: 'relatedIntegrationIds',
      label: 'Related integration',
      selectOptions: integrations
    });
  }

  fields = [...fields, ownerOptions];

  return fields;
};

export const getEnv = ({
  name,
  defaultValue
}: {
  name: string;
  defaultValue?: string;
}): string => {
  const value = process.env[name];

  if (!value && typeof defaultValue !== 'undefined') {
    return defaultValue;
  }

  if (!value) {
    debug.info(`Missing environment variable configuration for ${name}`);
  }

  return value || '';
};

export const getContentItem = async (
  { Customers, Companies }: IModels,
  activityLog
) => {
  const { action, contentType, content } = activityLog;

  if (action === 'merge') {
    let result = {};

    switch (contentType) {
      case 'company':
        result = await Companies.find({ _id: { $in: content } }).lean();
        break;
      case 'customer':
        result = await Customers.find({ _id: { $in: content } }).lean();
        break;
      default:
        break;
    }

    return result;
  }

  return null;
};

export const getEditorAttributeUtil = async () => {
  const core = await getService('core');
  const services = await getServices();
  const editor = await new EditorAttributeUtil(
    messageBroker(),
    core.address,
    services
  );

  return editor;
};

export const prepareEngageCustomers = async (
  { Customers }: IModels,
  subdomain: string,
  { engageMessage, customersSelector, action, user }
): Promise<any> => {
  const customerInfos: Array<{
    _id: string;
    primaryEmail?: string;
    emailValidationStatus?: string;
    phoneValidationStatus?: string;
    primaryPhone?: string;
    replacers: Array<{ key: string; value: string }>;
  }> = [];

  const emailConf = engageMessage.email ? engageMessage.email : { content: '' };
  const emailContent = emailConf.content || '';

  const editorAttributeUtil = await getEditorAttributeUtil();
  const customerFields = await editorAttributeUtil.getCustomerFields(
    emailContent
  );

  const onFinishPiping = async () => {
    await sendEngagesMessage({
      subdomain,
      action: 'pre-notification',
      data: { engageMessage, customerInfos }
    });

    if (customerInfos.length > 0) {
      const data: any = {
        customers: [],
        fromEmail: user.email,
        engageMessageId: engageMessage._id,
        shortMessage: engageMessage.shortMessage || {},
        createdBy: engageMessage.createdBy,
        title: engageMessage.title,
        kind: engageMessage.kind
      };

      if (engageMessage.method === 'email' && engageMessage.email) {
        const replacedContent = await editorAttributeUtil.replaceAttributes({
          customerFields,
          content: emailContent,
          user
        });

        engageMessage.email.content = replacedContent;

        data.email = engageMessage.email;
      }

      const chunks = chunkArray(customerInfos, 3000);

      for (const chunk of chunks) {
        data.customers = chunk;

        await sendEngagesMessage({
          subdomain,
          action: 'notification',
          data: { action, data }
        });
      }
    }
  };

  const customersItemsMapping = JSON.parse('{}');

  const customerTransformerStream = new Transform({
    objectMode: true,

    async transform(customer: ICustomerDocument, _encoding, callback) {
      const itemsMapping = customersItemsMapping[customer._id] || [null];

      for (const item of itemsMapping) {
        const replacers = await editorAttributeUtil.generateReplacers({
          content: emailContent,
          customer,
          item,
          customerFields
        });

        customerInfos.push({
          _id: customer._id,
          primaryEmail: customer.primaryEmail,
          emailValidationStatus: customer.emailValidationStatus,
          phoneValidationStatus: customer.phoneValidationStatus,
          primaryPhone: customer.primaryPhone,
          replacers
        });
      }

      // signal upstream that we are ready to take more data
      callback();
    }
  });

  // generate fields option =======
  const fieldsOption = {
    primaryEmail: 1,
    emailValidationStatus: 1,
    phoneValidationStatus: 1,
    primaryPhone: 1
  };

  for (const field of customerFields || []) {
    fieldsOption[field] = 1;
  }

  const customersStream = (Customers.find(
    customersSelector,
    fieldsOption
  ) as any).stream();

  return new Promise((resolve, reject) => {
    const pipe = customersStream.pipe(customerTransformerStream);

    pipe.on('finish', async () => {
      try {
        await onFinishPiping();
      } catch (e) {
        return reject(e);
      }

      resolve({ status: 'done', customerInfos });
    });
  });
};
