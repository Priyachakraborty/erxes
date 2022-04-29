import { paginate } from 'erxes-api-utils';

const generateFilter = async (models, params, commonQuerySelector) => {
  const filter: any = commonQuerySelector;

  if (params.searchValue) {
    const contracts = await models.LoanContracts.find(
      { number: { $in: [new RegExp(`.*${params.searchValue}.*`, 'i')] } },
      { _id: 1 }
    );
    filter.contractId = { $in: contracts.map((item) => item._id) };
  }

  if (params.ids) {
    filter._id = { $in: params.ids };
  }

  if (params.contractId) {
    filter.contractId = params.contractId;
  }

  if (params.companyId) {
    filter.companyId = params.companyId;
  }

  if (params.customerId) {
    filter.customerId = params.customerId;
  }

  if (params.startDate) {
    filter.payDate = {
      $gte: new Date(params.startDate),
    };
  }

  if (params.endDate) {
    filter.payDate = {
      $lte: new Date(params.endDate),
    };
  }

  if (params.startDate && params.endDate) {
    filter.payDate = {
      $and: [
        { $gte: new Date(params.startDate) },
        { $lte: new Date(params.endDate) },
      ],
    };
  }

  if (params.payDate === 'today') {
    filter.payDate = { $and: [{ $gte: new Date() }, { $lte: new Date() }] };
  }

  if (params.contractHasnt) {
    filter.contractId = { $in: ['', null] };
  }

  return filter;
};

export const sortBuilder = (params) => {
  const sortField = params.sortField;
  const sortDirection = params.sortDirection || 0;

  if (sortField) {
    return { [sortField]: sortDirection };
  }

  return {};
};

const transactionQueries = {
  /**
   * Transactions list
   */
  transactions: async (
    _root,
    params,
    { commonQuerySelector, models, checkPermission, user }
  ) => {
    await checkPermission('showTransactions', user);
    return paginate(
      models.LoanTransactions.find(
        await generateFilter(models, params, commonQuerySelector)
      ),
      {
        page: params.page,
        perPage: params.perPage,
      }
    );
  },

  /**
   * Transactions for only main list
   */

  transactionsMain: async (
    _root,
    params,
    { commonQuerySelector, models, checkPermission, user }
  ) => {
    await checkPermission('showTransactions', user);
    const filter = await generateFilter(models, params, commonQuerySelector);

    return {
      list: await paginate(
        models.LoanTransactions.find(filter).sort(sortBuilder(params)),
        {
          page: params.page,
          perPage: params.perPage,
        }
      ),
      totalCount: await models.LoanTransactions.find(filter).count(),
    };
  },

  /**
   * Get one transaction
   */

  transactionDetail: async (
    _root,
    { _id },
    { models, checkPermission, user }
  ) => {
    await checkPermission('showTransactions', user);
    return models.LoanTransactions.getTransaction(models, { _id });
  },
};

export default transactionQueries;