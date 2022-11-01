import { classInstanceReducer } from 'redux-class-watcher';
import { startEthAdapter } from './adapter/ethAdapter.js';
export { getEthAdapter } from './adapter/ethAdapter.js'

export function configureReduxCombatibleAdapter(jsonRpcProvider) {
    let ethAdapter = startEthAdapter({ jsonRpcProvider: jsonRpcProvider });
    let [ethAdapterReducer, ethAdapterEqualize] = classInstanceReducer(ethAdapter, "ethAdapter");
    ethAdapter._setEqualizeFunction(ethAdapterEqualize);
    return [ethAdapterReducer, ethAdapter];
}