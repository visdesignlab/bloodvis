import React, { FC, useEffect, useRef, useLayoutEffect, useState } from "react";
import Store from "../../Interfaces/Store";
import { inject, observer } from "mobx-react";
import { actions } from "../..";
import { ComparisonDataPoint, ExtraPairInterventionPoint } from '../../Interfaces/ApplicationState'
import { barChartAggregationOptions, barChartValuesOptions, extraPairOptions, ChartSVG } from "../../PresetsProfile"
import { Grid, Dropdown, Menu } from "semantic-ui-react";
import { timeFormat } from "d3";
import InterventionPlot from "./ComparisonPlot";
import axios from 'axios';
import { stateUpdateWrapperUseJSON, generateExtrapairPlotDataWithIntervention, generateComparisonData } from "../../HelperFunctions";
import NotationForm from "../Utilities/NotationForm";

interface OwnProps {
    aggregatedBy: string;
    valueToVisualize: string;
    chartId: string;
    store?: Store;
    chartIndex: number;
    interventionDate: number;
    interventionPlotType: string;
    extraPair?: string;
    hemoglobinDataSet: any;
    notation: string;
    w: number
}

export type Props = OwnProps;

const InterventionPlotVisualization: FC<Props> = ({ w, notation, hemoglobinDataSet, extraPair, aggregatedBy, valueToVisualize, chartId, store, chartIndex, interventionDate, interventionPlotType }: Props) => {
    const {
        layoutArray,
        proceduresSelection,
        showZero,
        previewMode,
        currentSelectPatientGroupIDs,
        currentOutputFilterSet,
        rawDateRange,
        dateRange, procedureTypeSelection,
        outcomesSelection,
        mainCompWidth,
    } = store!;

    const svgRef = useRef<SVGSVGElement>(null);

    const [extraPairData, setExtraPairData] = useState<ExtraPairInterventionPoint[]>([])

    const [data, setData] = useState<ComparisonDataPoint[]>([]);



    // const [dimensions, setDimensions] = useState({ height: 0, width: 0 });

    const [width, setWidth] = useState(0)
    const [height, setHeight] = useState(0)

    //  const [caseIDDictionary, setCaseIDList] = useState<any>(null)
    const [extraPairArray, setExtraPairArray] = useState<string[]>([]);
    const [previousCancelToken, setPreviousCancelToken] = useState<any>(null)


    useEffect(() => {
        if (extraPair) { stateUpdateWrapperUseJSON(extraPairArray, JSON.parse(extraPair), setExtraPairArray) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [extraPair])

    useLayoutEffect(() => {
        if (svgRef.current) {
            // setDimensions({
            //     height: svgRef.current.clientHeight,
            //     width: svgRef.current.clientWidth
            // });
            setWidth(svgRef.current.clientWidth);
            // setWidth(w === 1 ? 542.28 : 1146.97)
            setHeight(svgRef.current.clientHeight);
        }
    }, [layoutArray, mainCompWidth]);

    useEffect(() => {
        if (new Date(interventionDate).getTime() < new Date(rawDateRange[0]).getTime() || new Date(interventionDate).getTime() > new Date(rawDateRange[1]).getTime()) {
            actions.removeChart(chartId)
        }
    }, [rawDateRange, chartId, interventionDate])




    useEffect(() => {
        if (previousCancelToken) {
            previousCancelToken.cancel("cancel the call.")
        }
        let temporaryDataHolder: any = {};
        //  let caseDictionary = {} as any;
        let preCaseSetReturnedFromQuery = new Set();
        let postCaseSetReturnedFromQuery = new Set();

        const cancelToken = axios.CancelToken;
        const call = cancelToken.source();
        setPreviousCancelToken(call);
        const getPreInt = () => {
            return axios.get(`${process.env.REACT_APP_QUERY_URL}request_transfused_units?transfusion_type=ALL_UNITS&date_range=${[dateRange[0], timeFormat("%d-%b-%Y")(new Date(interventionDate))]}&filter_selection=${proceduresSelection.toString()}&case_ids=${currentSelectPatientGroupIDs.toString()}`, {
                cancelToken: call.token
            })
        }
        const getPostInt = () => {
            return axios.get(`${process.env.REACT_APP_QUERY_URL}request_transfused_units?transfusion_type=ALL_UNITS&date_range=${[timeFormat("%d-%b-%Y")(new Date(interventionDate)), dateRange[1]]}&filter_selection=${proceduresSelection.toString()}&case_ids=${currentSelectPatientGroupIDs.toString()}`, {
                cancelToken: call.token
            })
        }

        Promise.all([getPreInt(), getPostInt()])
            .then(function (results) {
                const preInterventiondataResult = results[0].data;
                const postInterventionResult = results[1].data;

                if (preInterventiondataResult && postInterventionResult) {
                    preInterventiondataResult.forEach((element: any) => {
                        preCaseSetReturnedFromQuery.add(element.case_id);
                    })
                    postInterventionResult.forEach((element: any) => {
                        postCaseSetReturnedFromQuery.add(element.case_id);
                    })
                    hemoglobinDataSet.forEach((singleCase: any) => {
                        let criteriaMet = true;
                        if (currentOutputFilterSet.length > 0) {
                            for (let selectSet of currentOutputFilterSet) {
                                if (selectSet.setName === aggregatedBy) {
                                    if (!selectSet.setValues.includes(singleCase[aggregatedBy])) {
                                        criteriaMet = false;
                                    }
                                }
                            }
                        }

                        if (!procedureTypeSelection[singleCase.SURGERY_TYPE]) {
                            criteriaMet = false;
                        }
                        else if (outcomesSelection) {
                            if (singleCase[outcomesSelection] === 0) {
                                criteriaMet = false;
                            }

                        }

                        if (preCaseSetReturnedFromQuery.has(singleCase.CASE_ID) && criteriaMet) {
                            // caseDictionary[singleCase.CASE_ID] = true;
                            if (!temporaryDataHolder[singleCase[aggregatedBy]]) {
                                temporaryDataHolder[singleCase[aggregatedBy]] = {
                                    aggregateAttribute: singleCase[aggregatedBy],
                                    preData: [],
                                    postData: [],
                                    prePatientIDList: new Set(),
                                    postPatienIDList: new Set(),
                                    preCaseIDList: new Set(),
                                    postCaseIDList: new Set()
                                }
                            }
                            temporaryDataHolder[singleCase[aggregatedBy]].preData.push(singleCase)
                            temporaryDataHolder[singleCase[aggregatedBy]].prePatientIDList.add(singleCase.PATIENT_ID)
                        } else if (postCaseSetReturnedFromQuery.has(singleCase.CASE_ID) && criteriaMet) {
                            //  caseDictionary[singleCase.CASE_ID] = true;
                            if (!temporaryDataHolder[singleCase[aggregatedBy]]) {
                                temporaryDataHolder[singleCase[aggregatedBy]] = {
                                    aggregateAttribute: singleCase[aggregatedBy],
                                    preData: [],
                                    postData: [],
                                    prePatientIDList: new Set(),
                                    postPatienIDList: new Set(),
                                    preCaseIDList: new Set(),
                                    postCaseIDList: new Set()
                                }
                            }
                            temporaryDataHolder[singleCase[aggregatedBy]].postData.push(singleCase)
                            temporaryDataHolder[singleCase[aggregatedBy]].postPatienIDList.add(singleCase.PATIENT_ID)
                        }


                    })
                    const [caseCount, outputData] = generateComparisonData(temporaryDataHolder, showZero, valueToVisualize)
                    stateUpdateWrapperUseJSON(data, outputData, setData);
                    // stateUpdateWrapperUseJSON(caseIDDictionary, caseDictionary, setCaseIDList)
                    store!.totalAggregatedCaseCount = caseCount as number;
                }
            }).catch(function (thrown) {
                if (axios.isCancel(thrown)) {
                    console.log('Request canceled', thrown.message);
                } else {
                    // handle error
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [proceduresSelection, procedureTypeSelection, hemoglobinDataSet, dateRange, aggregatedBy, outcomesSelection, showZero, interventionDate, valueToVisualize, currentSelectPatientGroupIDs, currentOutputFilterSet]);


    useEffect(() => {
        const newExtraPairData = generateExtrapairPlotDataWithIntervention(aggregatedBy, hemoglobinDataSet, extraPairArray, data, valueToVisualize)
        stateUpdateWrapperUseJSON(extraPairData, newExtraPairData, setExtraPairData)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [extraPairArray, data, hemoglobinDataSet]);

    const changeAggregation = (e: any, value: any) => {
        actions.changeChart(value.value, valueToVisualize, chartId, "INTERVENTION")
    }
    const changeValue = (e: any, value: any) => {
        actions.changeChart(aggregatedBy, value.value, chartId, "INTERVENTION")
    }



    return (

        <Grid style={{ height: "100%" }} >
            <Grid.Row >
                <Grid.Column verticalAlign="middle" width={1} style={{ display: previewMode ? "none" : null }}>
                    <Menu icon vertical compact size="mini" borderless secondary widths={2}>
                        <Menu.Item fitted>
                            <Dropdown disabled={extraPairArray.length >= 5} selectOnBlur={false} basic item icon="plus" compact>
                                <Dropdown.Menu>
                                    {
                                        extraPairOptions.map((d: { value: string; title: string }) => {
                                            return (
                                                <Dropdown.Item
                                                    onClick={() => {
                                                        actions.changeExtraPair(chartId, d.value);
                                                    }}
                                                >
                                                    {d.title}
                                                </Dropdown.Item>
                                            )
                                        })
                                    }
                                </Dropdown.Menu>
                            </Dropdown>
                        </Menu.Item >

                        <Menu.Item>
                            <Dropdown selectOnBlur={false} pointing basic item icon="settings" compact >
                                <Dropdown.Menu>
                                    <Dropdown text="Change Aggregation" pointing basic item compact options={[barChartAggregationOptions[0], barChartAggregationOptions[2]]} onChange={changeAggregation}></Dropdown>
                                    <Dropdown text="Change Value" pointing basic item compact options={barChartValuesOptions} onChange={changeValue}></Dropdown>
                                    {/* <Dropdown text="Change Type" pointing basic item compact options={interventionChartType} onChange={changeType}></Dropdown> */}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Menu.Item>



                    </Menu>
                </Grid.Column>
                <Grid.Column width={(15) as any}>
                    <ChartSVG ref={svgRef}>

                        <InterventionPlot
                            interventionDate={interventionDate}
                            chartId={chartId}
                            //dimensionWhole={dimensions}
                            dimensionWidth={width}
                            dimensionHeight={height}
                            data={data}
                            svg={svgRef}
                            aggregatedBy={aggregatedBy}
                            valueToVisualize={valueToVisualize}

                            plotType={interventionPlotType}
                            extraPairDataSet={extraPairData}
                        />
                    </ChartSVG>

                    <NotationForm notation={notation} chartId={chartId} />

                </Grid.Column>

            </Grid.Row>
        </Grid>
    );
}


export default inject("store")(observer(InterventionPlotVisualization));

