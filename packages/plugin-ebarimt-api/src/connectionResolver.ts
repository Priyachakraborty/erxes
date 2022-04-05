import * as mongoose from "mongoose";
import { mainDb } from "./configs";
import { IPutResponseDoc } from "./models/definitions/ebarimt";
import { IPutResponseModel, loadPutResponseClass } from "./models/Ebarimt";
import { IContext as IMainContext } from "@erxes/api-utils/src";

export interface IModels {
  Ebarimt: IPutResponseModel;
}
export interface IContext extends IMainContext {
  subdomain: string;
  models: IModels;
}

export let models: IModels;

export const generateModels = async (
  _hostnameOrSubdomain: string
): Promise<IModels> => {
  if (models) {
    return models;
  }

  loadClasses(mainDb);

  return models;
};

export const loadClasses = (db: mongoose.Connection): IModels => {
  models = {} as IModels;

  models.Ebarimt = db.model<IPutResponseDoc, IPutResponseModel>(
    "ebarimt",
    loadPutResponseClass(models)
  );

  return models;
};
