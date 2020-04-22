import { observable, computed } from 'mobx'
import {
  defaultState,
  LayoutElement,
  SelectSet,
  DumbbellDataPoint,
  SingleCasePoint
} from "./ApplicationState";
import { timeFormat } from 'd3';

export default class Store {
  @observable isAtRoot: boolean = true;
  @observable isAtLatest: boolean = true;
  @observable currentSelectedChart: string = defaultState.currentSelectedChart;
  @observable layoutArray: LayoutElement[] = defaultState.layoutArray;
  // @observable perCaseSelected: boolean = defaultState.perCaseSelected;
  @observable showZero: boolean = defaultState.showZero;
  //@observable yearRange: number[] = defaultState.yearRange;

  @observable rawDateRange: any[] = defaultState.rawDateRange;

  @observable filterSelection: string[] = defaultState.filterSelection;
  //@observable totalCaseCount: number = defaultState.totalCaseCount;
  // @observable dumbbellSorted: boolean = defaultState.dumbbellSorted;
  @observable currentSelectSet: SelectSet[] = defaultState.currentSelectSet;
  @observable currentSelectPatient: SingleCasePoint | null = defaultState.currentSelectPatient;
  // @computed get actualYearRange() {
  //   return [this.yearRange[0] + 2014, this.yearRange[1] + 2014]
  // }
  @computed get dateRange() {
    return [timeFormat("%d-%b-%Y")(this.rawDateRange[0]), timeFormat("%d-%b-%Y")(this.rawDateRange[1])]
  }
  @observable hemoglobinDataSet: any = defaultState.hemoglobinDataSet;
  @observable currentOutputFilterSet: SelectSet[] = defaultState.currentOutputFilterSet;

}


export const store = new Store()