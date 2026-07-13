import { WeatherType, IrrigationMode } from '../context/SimulationContext';

// Encapsulates standard simulation scenarios and operations to trigger state updates
export const SimulationController = {
    triggerDrought(dispatch: any) {
        dispatch({ type: 'SCENARIO_DROUGHT' });
    },

    triggerRain(dispatch: any) {
        dispatch({ type: 'SCENARIO_RAIN' });
    },

    setWeather(dispatch: any, weather: WeatherType) {
        dispatch({ type: 'SET_WEATHER', weather });
    },

    togglePump(dispatch: any) {
        dispatch({ type: 'TOGGLE_PUMP' });
    },

    toggleValve(dispatch: any, sensorId: string) {
        dispatch({ type: 'TOGGLE_VALVE', id: sensorId });
    },

    setSensorMode(dispatch: any, sensorId: string, mode: IrrigationMode) {
        dispatch({ type: 'SET_MODE', id: sensorId, mode });
    },

    setGlobalMode(dispatch: any, mode: IrrigationMode) {
        dispatch({ type: 'SET_GLOBAL_MODE', mode });
    },

    toggleOnline(dispatch: any, sensorId: string) {
        dispatch({ type: 'TOGGLE_ONLINE', id: sensorId });
    },

    updateThresholds(dispatch: any, sensorId: string, minMoisture: number, maxMoisture: number) {
        dispatch({ type: 'UPDATE_THRESHOLDS', id: sensorId, minMoisture, maxMoisture });
    },

    resetSimulation(dispatch: any) {
        dispatch({ type: 'RESET' });
    },

    toggleClock(dispatch: any) {
        dispatch({ type: 'TOGGLE_PAUSE' });
    },

    setClockSpeed(dispatch: any, speed: number) {
        dispatch({ type: 'SET_SPEED', speed });
    },

    clearActivityLog(dispatch: any) {
        dispatch({ type: 'CLEAR_LOG' });
    }
};
export type SimulationControllerType = typeof SimulationController;
export default SimulationController;
