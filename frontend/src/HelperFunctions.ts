import { BasicAggregatedDatePoint, ExtraPairInterventionPoint, ComparisonDataPoint, ExtraPairPoint } from "./Interfaces/ApplicationState"
import { mean, median, sum } from "d3";
import { create as createpd } from "pdfast";

export const stateUpdateWrapperUseJSON = (oldState: any, newState: any, updateFunction: (value: React.SetStateAction<any>) => void) => {
    if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
        updateFunction(newState)
    }
}

export const generateExtrapairPlotDataWithIntervention = (caseIDList: any, aggregatedBy: string, hemoglobinDataSet: [], extraPairArray: string[], data: ComparisonDataPoint[]) => {
    let newExtraPairData: ExtraPairInterventionPoint[] = []
    if (extraPairArray.length > 0) {
        extraPairArray.forEach((variable: string) => {
            let newData = {} as any;
            let temporaryDataHolder: any = {}
            let temporaryPreIntDataHolder: any = {}
            let temporaryPostIntDataHolder: any = {}
            let preIntData = {} as any;
            let postIntData = {} as any;
            let kdeMax = 0;
            let postMedianData = {} as any;
            let preMedianData = {} as any;
            let medianData = {} as any;

            let preCaseDicts = {} as any;
            let postCaseDicts = {} as any;

            switch (variable) {
                case "Total Transfusion":
                    //let newDataBar = {} as any;
                    data.map((dataPoint: ComparisonDataPoint) => {
                        newData[dataPoint.aggregateAttribute] = dataPoint.preTotalVal + dataPoint.postTotalVal;
                        preIntData[dataPoint.aggregateAttribute] = dataPoint.preTotalVal;
                        postIntData[dataPoint.aggregateAttribute] = dataPoint.postTotalVal;
                    });
                    newExtraPairData.push({ name: "Total Transfusion", label: "Total", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "BarChart" });
                    break;

                case "Per Case":
                    // let newDataPerCase = {} as any;
                    data.map((dataPoint: ComparisonDataPoint) => {
                        newData[dataPoint.aggregateAttribute] = (dataPoint.preTotalVal + dataPoint.postTotalVal) / (dataPoint.preCaseCount + dataPoint.postCaseCount);
                        preIntData[dataPoint.aggregateAttribute] = dataPoint.preTotalVal / dataPoint.preCaseCount;
                        postIntData[dataPoint.aggregateAttribute] = dataPoint.postTotalVal / dataPoint.postCaseCount;

                    });
                    newExtraPairData.push({ name: "Per Case", label: "Per Case", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "BarChart" });
                    break;

                //TODO Add actual number to the result so that the hover pop is showing actual numbers. 
                case "Zero Transfusion":
                    //let newDataPerCase = {} as any;
                    // console.log(data)
                    data.map((dataPoint: ComparisonDataPoint) => {

                        newData[dataPoint.aggregateAttribute] = {
                            calculated: (dataPoint.preZeroCaseNum + dataPoint.postZeroCaseNum) / (dataPoint.preCaseCount + dataPoint.postCaseCount),
                            actualVal: (dataPoint.preZeroCaseNum + dataPoint.postZeroCaseNum),
                            outOfTotal: dataPoint.preCaseCount + dataPoint.postCaseCount
                        }

                        preIntData[dataPoint.aggregateAttribute] = {
                            calculated: dataPoint.preZeroCaseNum / dataPoint.preCaseCount,
                            actualVal: dataPoint.preZeroCaseNum,
                            outOfTotal: dataPoint.preCaseCount
                        }

                        postIntData[dataPoint.aggregateAttribute] = {
                            calculated: dataPoint.postZeroCaseNum / dataPoint.postCaseCount,
                            actualVal: dataPoint.postZeroCaseNum,
                            outOfTotal: dataPoint.postCaseCount
                        }
                    });

                    newExtraPairData.push({ name: "Zero Transfusion", label: "Zero %", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "Basic" });
                    break;

                case "Death":
                    data.map((dataPoint: ComparisonDataPoint) => {
                        temporaryPreIntDataHolder[dataPoint.aggregateAttribute] = [];
                        temporaryPostIntDataHolder[dataPoint.aggregateAttribute] = [];
                        temporaryDataHolder[dataPoint.aggregateAttribute] = [];
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount + dataPoint.postCaseCount };
                        preIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount };
                        postIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.postCaseCount };
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.DEATH)
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPreIntDataHolder[ob[aggregatedBy]].push(ob.DEATH);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPostIntDataHolder[ob[aggregatedBy]].push(ob.DEATH);
                            }
                        }

                    })

                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any)

                        preIntData[key].calculated = mean(temporaryPreIntDataHolder[key])
                        preIntData[key].actualVal = sum(temporaryPreIntDataHolder[key])

                        postIntData[key].calculated = mean(temporaryPostIntDataHolder[key])
                        postIntData[key].actualVal = sum(temporaryPostIntDataHolder[key])
                    }

                    newExtraPairData.push({ name: "Death", label: "Death", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "Basic" });
                    break;

                case "VENT":
                    data.map((dataPoint: ComparisonDataPoint) => {
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)

                        temporaryPreIntDataHolder[dataPoint.aggregateAttribute] = [];
                        temporaryPostIntDataHolder[dataPoint.aggregateAttribute] = [];
                        temporaryDataHolder[dataPoint.aggregateAttribute] = [];
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount + dataPoint.postCaseCount };
                        preIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount };
                        postIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.postCaseCount };
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.VENT)
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPreIntDataHolder[ob[aggregatedBy]].push(ob.VENT);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPostIntDataHolder[ob[aggregatedBy]].push(ob.VENT);
                            }
                        }

                    })
                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any)

                        preIntData[key].calculated = mean(temporaryPreIntDataHolder[key])
                        preIntData[key].actualVal = sum(temporaryPreIntDataHolder[key])

                        postIntData[key].calculated = mean(temporaryPostIntDataHolder[key])
                        postIntData[key].actualVal = sum(temporaryPostIntDataHolder[key])
                    }

                    newExtraPairData.push({ name: "VENT", label: "Vent", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "Basic" });
                    break;

                case "ECMO":
                    data.map((dataPoint: ComparisonDataPoint) => {
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)

                        temporaryPreIntDataHolder[dataPoint.aggregateAttribute] = [];
                        temporaryPostIntDataHolder[dataPoint.aggregateAttribute] = [];
                        temporaryDataHolder[dataPoint.aggregateAttribute] = [];
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount + dataPoint.postCaseCount };
                        preIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount };
                        postIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.postCaseCount };
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.ECMO)
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPreIntDataHolder[ob[aggregatedBy]].push(ob.ECMO);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPostIntDataHolder[ob[aggregatedBy]].push(ob.ECMO);
                            }
                        }

                    })

                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any)

                        preIntData[key].calculated = mean(temporaryPreIntDataHolder[key])
                        preIntData[key].actualVal = sum(temporaryPreIntDataHolder[key])

                        postIntData[key].calculated = mean(temporaryPostIntDataHolder[key])
                        postIntData[key].actualVal = sum(temporaryPostIntDataHolder[key])
                    }

                    newExtraPairData.push({ name: "ECMO", label: "ECMO", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "Basic" });
                    break;
                case "STROKE":
                    data.map((dataPoint: ComparisonDataPoint) => {
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)

                        temporaryPreIntDataHolder[dataPoint.aggregateAttribute] = []
                        temporaryPostIntDataHolder[dataPoint.aggregateAttribute] = []
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount + dataPoint.postCaseCount };
                        preIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.preCaseCount };
                        postIntData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.postCaseCount };
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.STROKE)
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPreIntDataHolder[ob[aggregatedBy]].push(ob.STROKE);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPostIntDataHolder[ob[aggregatedBy]].push(ob.STROKE);
                            }
                        }

                    })

                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any)

                        preIntData[key].calculated = mean(temporaryPreIntDataHolder[key])
                        preIntData[key].actualVal = sum(temporaryPreIntDataHolder[key])

                        postIntData[key].calculated = mean(temporaryPostIntDataHolder[key])
                        postIntData[key].actualVal = sum(temporaryPostIntDataHolder[key])
                    }

                    newExtraPairData.push({ name: "STROKE", label: "Stroke", preIntData: preIntData, postIntData: postIntData, totalIntData: newData, type: "Basic" });
                    break;

                case "RISK":
                    // let temporaryDataHolder: any = {}
                    data.map((dataPoint: ComparisonDataPoint) => {
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)

                        temporaryPreIntDataHolder[dataPoint.aggregateAttribute] = []
                        temporaryPostIntDataHolder[dataPoint.aggregateAttribute] = []
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.DRG_WEIGHT)
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPreIntDataHolder[ob[aggregatedBy]].push(ob.DRG_WEIGHT);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                temporaryPostIntDataHolder[ob[aggregatedBy]].push(ob.DRG_WEIGHT);
                            }
                        }
                    })

                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        medianData[key] = median(value as any);
                        preMedianData[key] = median(temporaryPreIntDataHolder[key]);
                        postMedianData[key] = median(temporaryPostIntDataHolder[key]);

                        let pd = createpd(value, { min: 0, max: 30 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        let reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        newData[key] = pd;

                        pd = createpd(temporaryPreIntDataHolder[key], { min: 0, max: 30 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        preIntData[key] = pd;

                        pd = createpd(temporaryPostIntDataHolder[key], { min: 0, max: 30 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        postIntData[key] = pd;
                    }

                    newExtraPairData.push({
                        name: "RISK",
                        label: "Risk",
                        preIntData: preIntData,
                        postIntData: postIntData,
                        totalIntData: newData,
                        type: "Violin",
                        kdeMax: kdeMax,
                        totalMedianSet: medianData,
                        preMedianSet: preMedianData,
                        postMedianSet: postMedianData
                    });
                    break;
                case "Preop HGB":
                    data.map((dataPoint: ComparisonDataPoint) => {
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)

                        newData[dataPoint.aggregateAttribute] = [];
                        preIntData[dataPoint.aggregateAttribute] = [];
                        postIntData[dataPoint.aggregateAttribute] = [];
                    });
                    hemoglobinDataSet.map((ob: any) => {
                        const resultValue = parseFloat(ob.PREOP_HGB);
                        if (newData[ob[aggregatedBy]] && resultValue > 0 && caseIDList[ob.CASE_ID]) {
                            newData[ob[aggregatedBy]].push(resultValue);
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                preIntData[ob[aggregatedBy]].push(resultValue);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                postIntData[ob[aggregatedBy]].push(resultValue);
                            }
                        }
                    });

                    for (let prop in newData) {
                        medianData[prop] = median(newData[prop]) || 0;
                        preMedianData[prop] = median(preIntData[prop]) || 0;
                        postMedianData[prop] = median(postIntData[prop]) || 0;

                        let pd = createpd(newData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        let reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        newData[prop] = pd;

                        pd = createpd(preIntData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        preIntData[prop] = pd;

                        pd = createpd(postIntData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        postIntData[prop] = pd;
                    }

                    newExtraPairData.push({
                        name: "Preop HGB",
                        label: "Preop HGB",
                        preIntData: preIntData,
                        postIntData: postIntData,
                        totalIntData: newData,
                        type: "Violin",
                        kdeMax: kdeMax,
                        totalMedianSet: medianData,
                        preMedianSet: preMedianData,
                        postMedianSet: postMedianData
                    });
                    break;

                case "Postop HGB":
                    data.map((dataPoint: ComparisonDataPoint) => {
                        preCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.preCaseIDList)
                        postCaseDicts[dataPoint.aggregateAttribute] = new Set(dataPoint.postCaseIDList)

                        newData[dataPoint.aggregateAttribute] = [];
                        preIntData[dataPoint.aggregateAttribute] = [];
                        postIntData[dataPoint.aggregateAttribute] = [];
                    });
                    hemoglobinDataSet.map((ob: any) => {
                        const resultValue = parseFloat(ob.POSTOP_HGB);
                        if (newData[ob[aggregatedBy]] && resultValue > 0 && caseIDList[ob.CASE_ID]) {
                            newData[ob[aggregatedBy]].push(resultValue);
                            if (preCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                preIntData[ob[aggregatedBy]].push(resultValue);
                            }
                            if (postCaseDicts[ob[aggregatedBy]].has(ob.CASE_ID)) {
                                postIntData[ob[aggregatedBy]].push(resultValue);
                            }
                        }
                    });

                    for (let prop in newData) {
                        medianData[prop] = median(newData[prop]);
                        preMedianData[prop] = median(preIntData[prop]);
                        postMedianData[prop] = median(postIntData[prop])

                        let pd = createpd(newData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        let reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        newData[prop] = pd;

                        pd = createpd(preIntData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        preIntData[prop] = pd;

                        pd = createpd(postIntData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        reverse_pd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reverse_pd);
                        postIntData[prop] = pd;
                    }

                    newExtraPairData.push({
                        name: "Postop HGB", label: "Postop HGB",
                        preIntData: preIntData,
                        postIntData: postIntData,
                        totalIntData: newData,
                        type: "Violin",
                        kdeMax: kdeMax,
                        totalMedianSet: medianData,
                        preMedianSet: preMedianData,
                        postMedianSet: postMedianData
                    });
                    break;

                default:
                    break;
            }
        }
        )
    }
    return newExtraPairData
}

export const generateExtrapairPlotData = (caseIDList: any, aggregatedBy: string, hemoglobinDataSet: [], extraPairArray: string[], data: BasicAggregatedDatePoint[]) => {
    let newExtraPairData: ExtraPairPoint[] = []
    if (extraPairArray.length > 0) {
        extraPairArray.forEach((variable: string) => {
            let newData = {} as any;
            let kdeMax = 0;
            let temporaryDataHolder: any = {}
            let medianData = {} as any;
            switch (variable) {
                case "Total Transfusion":
                    //let newDataBar = {} as any;
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        newData[dataPoint.aggregateAttribute] = dataPoint.totalVal;
                    });
                    newExtraPairData.push({ name: "Total Transfusion", label: "Total", data: newData, type: "BarChart" });
                    break;
                case "Per Case":
                    // let newDataPerCase = {} as any;
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        newData[dataPoint.aggregateAttribute] = dataPoint.totalVal / dataPoint.caseCount;
                    });
                    newExtraPairData.push({ name: "Per Case", label: "Per Case", data: newData, type: "BarChart" });
                    break;
                case "Zero Transfusion":
                    //let newDataPerCase = {} as any;
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        newData[dataPoint.aggregateAttribute] = { actualVal: dataPoint.zeroCaseNum, calculated: dataPoint.zeroCaseNum / dataPoint.caseCount, outOfTotal: dataPoint.caseCount };
                    });
                    newExtraPairData.push({ name: "Zero Transfusion", label: "Zero %", data: newData, type: "Basic" });
                    break;

                case "Death":
                    // let temporaryDataHolder: any = {}
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.caseCount }
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.DEATH)
                        }
                    })
                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any);

                    }
                    newExtraPairData.push({ name: "Death", label: "Death", data: newData, type: "Basic" });
                    break;


                case "VENT":
                    // let temporaryDataHolder:any = {}
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.caseCount }
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.VENT)
                        }
                    })
                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any);
                    }
                    newExtraPairData.push({ name: "VENT", label: "Vent", data: newData, type: "Basic" });
                    break;
                case "ECMO":
                    // let temporaryDataHolder:any = {}
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.caseCount }
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.ECMO)
                        }
                    })
                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any);
                    }
                    newExtraPairData.push({ name: "ECMO", label: "ECMO", data: newData, type: "Basic" });
                    break;
                case "STROKE":
                    // let temporaryDataHolder:any = {}
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                        newData[dataPoint.aggregateAttribute] = { outOfTotal: dataPoint.caseCount }
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.STROKE)
                        }
                    })
                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        newData[key].calculated = mean(value as any);
                        newData[key].actualVal = sum(value as any);
                    }
                    newExtraPairData.push({ name: "STROKE", label: "Stroke", data: newData, type: "Basic" });
                    break;

                case "RISK":
                    // let temporaryDataHolder: any = {}
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        temporaryDataHolder[dataPoint.aggregateAttribute] = []
                    })
                    hemoglobinDataSet.map((ob: any) => {
                        if (temporaryDataHolder[ob[aggregatedBy]] && caseIDList[ob.CASE_ID]) {
                            temporaryDataHolder[ob[aggregatedBy]].push(ob.DRG_WEIGHT)
                        }
                    })
                    for (const [key, value] of Object.entries(temporaryDataHolder)) {
                        medianData[key] = median(value as any);
                        let pd = createpd(value, { min: 0, max: 30 });
                        pd = [{ x: 0, y: 0 }].concat(pd)
                        let reversePd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reversePd)
                        newData[key] = pd
                    }
                    newExtraPairData.push({ name: "RISK", label: "Risk", data: newData, type: "Violin", kdeMax: kdeMax, medianSet: medianData });
                    break;

                case "Preop HGB":
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        newData[dataPoint.aggregateAttribute] = [];
                    });
                    hemoglobinDataSet.map((ob: any) => {
                        const resultValue = parseFloat(ob.PREOP_HGB);
                        if (newData[ob[aggregatedBy]] && resultValue > 0 && caseIDList[ob.CASE_ID]) {
                            newData[ob[aggregatedBy]].push(resultValue);
                        }
                    });
                    for (let prop in newData) {
                        medianData[prop] = median(newData[prop]);
                        let pd = createpd(newData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        let reversePd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reversePd);
                        newData[prop] = pd;
                    }
                    newExtraPairData.push({ name: "Preop HGB", label: "Preop HGB", data: newData, type: "Violin", kdeMax: kdeMax, medianSet: medianData });
                    break;
                case "Postop HGB":
                    //let newData = {} as any;
                    data.map((dataPoint: BasicAggregatedDatePoint) => {
                        newData[dataPoint.aggregateAttribute] = [];
                    });
                    hemoglobinDataSet.map((ob: any) => {
                        const resultValue = parseFloat(ob.POSTOP_HGB);
                        if (newData[ob[aggregatedBy]] && resultValue > 0 && caseIDList[ob.CASE_ID]) {
                            newData[ob[aggregatedBy]].push(resultValue);
                        }
                    });
                    for (let prop in newData) {
                        medianData[prop] = median(newData[prop]);
                        let pd = createpd(newData[prop], { width: 2, min: 0, max: 18 });
                        pd = [{ x: 0, y: 0 }].concat(pd);
                        let reversePd = pd.map((pair: any) => {
                            kdeMax = pair.y > kdeMax ? pair.y : kdeMax;
                            return { x: pair.x, y: -pair.y };
                        }).reverse();
                        pd = pd.concat(reversePd);
                        newData[prop] = pd;
                    }
                    newExtraPairData.push({ name: "Postop HGB", label: "Postop HGB", data: newData, type: "Violin", kdeMax: kdeMax, medianSet: medianData });
                    break;
                default:
                    break;
            }
        }
        )
    }
    return newExtraPairData;
}