import { existsSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import * as TOML from '@iarna/toml';
import 'json-bigint-patch';
import * as R from 'ramda';
import { NodeConfig } from '../../shared/types';
import Warning, {
  WarningType,
  WriteFilePermissionWarningKind,
} from '../../shared/warning';
import { fetchNodeConfig } from '../utils';
import StoreService from '../storeService';
import { NODE_CONFIG_FILE, USERDATA_DIR } from './constants';
import { generateGenesisIDFromConfig } from './Networks';
import { safeSmeshingOpts } from './smeshingOpts';

export const loadNodeConfig = async (): Promise<NodeConfig> =>
  existsSync(NODE_CONFIG_FILE)
    ? fs
        .readFile(NODE_CONFIG_FILE, { encoding: 'utf8' })
        .then((res) =>
          res.startsWith('{') ? JSON.parse(res) : TOML.parse(res)
        )
    : {};

export const writeNodeConfig = async (config: NodeConfig): Promise<void> => {
  try {
    await fs.writeFile(NODE_CONFIG_FILE, JSON.stringify(config), {
      encoding: 'utf8',
    });
  } catch (error: any) {
    throw Warning.fromError(
      WarningType.WriteFilePermission,
      {
        kind: WriteFilePermissionWarningKind.ConfigFile,
        filePath: NODE_CONFIG_FILE,
      },
      error
    );
  }
};

const getCustomNodeConfigName = (genesisID: string) =>
  `node-config.${genesisID.substring(0, 8)}.json`;

export const loadCustomNodeConfig = async (
  genesisID: string
): Promise<Partial<NodeConfig>> => {
  const customConfigPath = path.join(
    USERDATA_DIR,
    getCustomNodeConfigName(genesisID)
  );

  return existsSync(customConfigPath)
    ? fs
        .readFile(customConfigPath, {
          encoding: 'utf8',
        })
        .then((res) => JSON.parse(res))
    : {};
};

export const writeCustomNodeConfig = async (
  genesisID: string,
  config: Partial<NodeConfig>
): Promise<void> => {
  const filePath = path.join(USERDATA_DIR, getCustomNodeConfigName(genesisID));
  try {
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), {
      encoding: 'utf8',
    });
  } catch (error: any) {
    throw Warning.fromError(
      WarningType.WriteFilePermission,
      {
        kind: WriteFilePermissionWarningKind.CustomConfigFile,
        filePath,
      },
      error
    );
  }
};

export const saveSmeshingOptsInCustomConfig = async (
  genesisID: string,
  opts: Partial<NodeConfig['smeshing']>
): Promise<Partial<NodeConfig>> => {
  const customConfig = await loadCustomNodeConfig(genesisID);

  customConfig.smeshing = opts;

  await writeCustomNodeConfig(genesisID, customConfig);

  return customConfig;
};

const createCustomNodeConfig = async (
  genesisID: string
): Promise<Partial<NodeConfig>> => {
  const opts: Partial<NodeConfig['smeshing']> | undefined = StoreService.get(
    `smeshing.${genesisID}`
  );

  // migrate options from StoreService or place only default opts
  const smeshingOpts = opts || safeSmeshingOpts(undefined, genesisID); // set default dir path

  const config = await saveSmeshingOptsInCustomConfig(genesisID, smeshingOpts);

  StoreService.remove(`smeshing.${genesisID}`);

  return config;
};
export const loadOrCreateCustomConfig = async (
  genesisID: string
): Promise<Partial<NodeConfig>> =>
  existsSync(path.join(USERDATA_DIR, getCustomNodeConfigName(genesisID)))
    ? loadCustomNodeConfig(genesisID)
    : createCustomNodeConfig(genesisID);

export const updateSmeshingOpts = async (
  netName: string,
  updateSmeshingOpts: Partial<NodeConfig['smeshing']>
): Promise<Partial<NodeConfig>> => {
  const customNodeConfig = await loadCustomNodeConfig(netName);
  const clientConfig = await loadNodeConfig();
  const smeshingOpts = {
    ...(R.isEmpty(updateSmeshingOpts) ? {} : customNodeConfig.smeshing), // on delete, ignore customNodeConfig smehsing
    ...(R.isEmpty(updateSmeshingOpts) // on delete , take default smeshing opts
      ? safeSmeshingOpts(undefined, generateGenesisIDFromConfig(clientConfig))
      : {}),
    ...updateSmeshingOpts, // apply update for other cases
  };

  const customConfig = await saveSmeshingOptsInCustomConfig(
    netName,
    smeshingOpts
  );
  const mergedConfig = R.mergeLeft(customConfig, clientConfig);

  await writeNodeConfig(mergedConfig);

  return mergedConfig;
};

export const downloadNodeConfig = async (networkConfigUrl: string) => {
  const discoveryConfig = await fetchNodeConfig(networkConfigUrl);
  const customNodeConfig = await loadOrCreateCustomConfig(
    generateGenesisIDFromConfig(discoveryConfig)
  );
  const mergedConfig = R.mergeLeft(customNodeConfig, discoveryConfig);

  await writeNodeConfig(mergedConfig);

  return mergedConfig;
};

export default {
  load: loadNodeConfig,
  download: downloadNodeConfig,
};
