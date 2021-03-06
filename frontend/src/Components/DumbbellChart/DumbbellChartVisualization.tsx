import React, {
    FC,
    useEffect,
    useRef,
    useLayoutEffect,
    useState
} from "react";
import Store from "../../Interfaces/Store";
import styled from "styled-components";
import { inject, observer } from "mobx-react";
import { actions } from "../..";
import { DumbbellDataPoint } from "../../Interfaces/ApplicationState"
import { BloodProductCap, dumbbellFacetOptions, ChartSVG } from "../../PresetsProfile"
import DumbbellChart from "./DumbbellChart"
import { Grid, Menu, Dropdown, Button } from "semantic-ui-react";
import { preop_color, postop_color, basic_gray } from "../../PresetsProfile";
import axios from 'axios';
import { stateUpdateWrapperUseJSON } from "../../HelperFunctions";
import NotationForm from "../Utilities/NotationForm";

interface OwnProps {
    yAxis: string;
    chartId: string;
    store?: Store;
    chartIndex: number;
    hemoglobinDataSet: any;
    notation: string;
    w: number;
    // interventionDate?: number;
}

export type Props = OwnProps;

const DumbbellChartVisualization: FC<Props> = ({ w, notation, yAxis, chartId, store, chartIndex, hemoglobinDataSet }: Props) => {

    const {
        layoutArray,
        proceduresSelection,
        currentSelectPatientGroupIDs,
        previewMode,
        dateRange,
        showZero,
        currentOutputFilterSet,
        outcomesSelection, mainCompWidth,
        procedureTypeSelection
    } = store!;

    const svgRef = useRef<SVGSVGElement>(null);
    const [data, setData] = useState<DumbbellDataPoint[]>([]);
    const [dimensionWidth, setDimensionWidth] = useState(0)
    const [dimensionHeight, setDimensionHeight] = useState(0)
    //  const [dimension, setDimensions] = useState({ width: 0, height: 0 });
    // const [yMax, setYMax] = useState(0);
    // const [xRange, setXRange] = useState({ xMin: 0, xMax: Infinity });
    const [xMin, setXMin] = useState(Infinity);
    const [xMax, setXMax] = useState(0)
    const [sortMode, setSortMode] = useState("Postop");
    const [showingAttr, setShowingAttr] = useState({ preop: true, postop: true, gap: true })
    const [previousCancelToken, setPreviousCancelToken] = useState<any>(null)

    useLayoutEffect(() => {
        if (svgRef.current) {
            setDimensionWidth(svgRef.current.clientWidth);
            //  setDimensionWidth(w === 1 ? 542.28 : 1146.97)
            setDimensionHeight(svgRef.current.clientHeight)

        }
    }, [layoutArray, mainCompWidth,]);


    useEffect(() => {
        if (previousCancelToken) {
            previousCancelToken.cancel("cancel the call?")
        }
        let transfused_dict = {} as any;
        let requestingAxis = yAxis;
        if (!BloodProductCap[yAxis]) {
            requestingAxis = "FFP_UNITS";
        }

        const cancelToken = axios.CancelToken;
        const call = cancelToken.source();
        setPreviousCancelToken(call);

        axios.get(`${process.env.REACT_APP_QUERY_URL}request_transfused_units?transfusion_type=${requestingAxis}&date_range=${dateRange}&filter_selection=${proceduresSelection.toString()}&case_ids=${currentSelectPatientGroupIDs.toString()}`, {
            cancelToken: call.token
        })
            .then(function (response) {
                const tempTransfusionData = response.data;
                let caseIDSet = new Set()
                tempTransfusionData.forEach((element: any) => {
                    caseIDSet.add(element.case_id)
                    transfused_dict[element.case_id] = {
                        transfused: element.transfused_units
                    };
                });

                let caseCount = 0;
                let tempXMin = Infinity;
                let tempXMax = 0;
                if (hemoglobinDataSet) {
                    //TODO:
                    //How to solve the total case viewing potential discrepency?
                    let existingCaseID = new Set();
                    let cast_data: DumbbellDataPoint[] = hemoglobinDataSet.map((ob: any) => {
                        const begin_x = ob.PREOP_HGB;
                        const end_x = ob.POSTOP_HGB;
                        let yAxisLabel_val;

                        if (transfused_dict[ob.CASE_ID]) {
                            yAxisLabel_val = BloodProductCap[yAxis] ? transfused_dict[ob.CASE_ID].transfused : ob[yAxis];
                        };
                        if (yAxisLabel_val !== undefined && begin_x > 0 && end_x > 0 && !existingCaseID.has(ob.CASE_ID)) {
                            if ((showZero) || (!showZero && yAxisLabel_val > 0)) {
                                if ((yAxisLabel_val > 100 && yAxis === "PRBC_UNITS")) {
                                    yAxisLabel_val -= 999
                                }
                                if ((yAxisLabel_val > 100 && yAxis === "PLT_UNITS")) {
                                    yAxisLabel_val -= 245
                                }
                                let criteriaMet = true;
                                if (currentOutputFilterSet.length > 0) {
                                    for (let selectSet of currentOutputFilterSet) {
                                        if (!selectSet.setValues.includes(ob[selectSet.setName])) {
                                            criteriaMet = false;
                                        }
                                    }
                                }


                                if (!procedureTypeSelection[ob.SURGERY_TYPE]) {
                                    criteriaMet = false;
                                }
                                else if (outcomesSelection) {

                                    if (ob[outcomesSelection] === 0) {
                                        criteriaMet = false;
                                    }

                                }

                                if (criteriaMet) {
                                    tempXMin = begin_x < tempXMin ? begin_x : tempXMin;
                                    tempXMin = end_x < tempXMin ? end_x : tempXMin;
                                    tempXMax = begin_x > tempXMax ? begin_x : tempXMax;
                                    tempXMax = end_x > tempXMax ? end_x : tempXMax;

                                    let new_ob: DumbbellDataPoint = {
                                        case: ob,
                                        startXVal: begin_x,
                                        endXVal: end_x,

                                        yVal: yAxisLabel_val,

                                    };
                                    existingCaseID.add(ob.CASE_ID)
                                    caseCount++
                                    return new_ob;
                                } else { return undefined }
                            } else { return undefined }
                            //}
                        } else { return undefined }
                    });
                    cast_data = cast_data.filter((d: any) => d);
                    store!.totalIndividualCaseCount = caseCount;
                    console.log("compare start")
                    stateUpdateWrapperUseJSON(data, cast_data, setData)
                    console.log("compare end")
                    setXMin(tempXMin)
                    setXMax(tempXMax)

                }
            }).catch(function (thrown) {
                if (axios.isCancel(thrown)) {
                    console.log('Request canceled', thrown.message);
                } else {
                    // handle error
                }
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, procedureTypeSelection, proceduresSelection, hemoglobinDataSet, yAxis, showZero, outcomesSelection, currentOutputFilterSet, currentSelectPatientGroupIDs]);

    const changeXVal = (value: any) => {
        actions.changeChart(value, "HGB_VALUE", chartId, "DUMBBELL")
    }

    return (
        <Grid style={{ height: "100%" }}>
            <Grid.Row>
                <Grid.Column verticalAlign="middle" width={2} style={{ display: previewMode ? "none" : null }}>
                    <Menu text compact size="mini" vertical>
                        <Menu.Item >Show</Menu.Item>
                        <Menu.Menu>
                            <Button.Group vertical size="mini">
                                <PreopButton basic={!showingAttr.preop} onClick={() => { setShowingAttr({ preop: !showingAttr.preop, postop: showingAttr.postop, gap: showingAttr.gap }) }} >Preop</PreopButton>
                                <PostopButton basic={!showingAttr.postop} onClick={() => { setShowingAttr({ preop: showingAttr.preop, postop: !showingAttr.postop, gap: showingAttr.gap }) }}>Postop</PostopButton>
                                <GapButton basic={!showingAttr.gap} onClick={() => { setShowingAttr({ preop: showingAttr.preop, postop: showingAttr.postop, gap: !showingAttr.gap }) }} >Gap</GapButton>
                            </Button.Group>
                        </Menu.Menu>

                        <Menu.Item >Sort By</Menu.Item>
                        <Menu.Menu>
                            <Button.Group vertical size="mini">
                                <PreopButton basic={sortMode !== "Preop"} onClick={() => { setSortMode("Preop") }}>Preop</PreopButton>
                                <PostopButton basic={sortMode !== "Postop"} onClick={() => { setSortMode("Postop") }}>Postop</PostopButton>
                                <GapButton basic={sortMode !== "Gap"} onClick={() => { setSortMode("Gap") }}>Gap</GapButton>
                            </Button.Group>
                        </Menu.Menu>

                        <Menu.Item >
                            <Dropdown selectOnBlur={false} basic item icon="settings" compact>
                                <Dropdown.Menu>
                                    {(dumbbellFacetOptions).map((d) => {
                                        return (<Dropdown.Item onClick={() => {
                                            changeXVal(d.value)
                                        }}>{d.text}</Dropdown.Item>)
                                    })}
                                </Dropdown.Menu>
                            </Dropdown>
                        </Menu.Item>



                    </Menu>
                    {/* <OptionsP>Show</OptionsP>
          <Button.Group vertical size="mini">
            <PreopButton basic={!showingAttr.preop} onClick={() => { setShowingAttr({ preop: !showingAttr.preop, postop: showingAttr.postop, gap: showingAttr.gap }) }} >Preop</PreopButton>
            <PostopButton basic={!showingAttr.postop} onClick={() => { setShowingAttr({ preop: showingAttr.preop, postop: !showingAttr.postop, gap: showingAttr.gap }) }}>Postop</PostopButton>
            <GapButton basic={!showingAttr.gap} onClick={() => { setShowingAttr({ preop: showingAttr.preop, postop: showingAttr.postop, gap: !showingAttr.gap }) }} >Gap</GapButton>
          </Button.Group>
          <OptionsP>Sort By</OptionsP>
          <Button.Group vertical size="mini">
            <PreopButton basic={sortMode !== "Preop"} onClick={() => { setSortMode("Preop") }}>Preop</PreopButton>
            <PostopButton basic={sortMode !== "Postop"} onClick={() => { setSortMode("Postop") }}>Postop</PostopButton>
            <GapButton basic={sortMode !== "Gap"} onClick={() => { setSortMode("Gap") }}>Gap</GapButton>
          </Button.Group> */}
                </Grid.Column>
                <Grid.Column width={14}  >
                    <ChartSVG ref={svgRef}>
                        {/* <text
          x="0"
          y="0"
          style={{
            fontSize: "10px",
            alignmentBaseline: "hanging"
          }}
        >
          chart # ${chartId}
        </text> */}
                        <DumbbellChart
                            svg={svgRef}
                            valueToVisualize={yAxis}
                            data={data}
                            dimensionHeight={dimensionHeight}
                            dimensionWidth={dimensionWidth}
                            xMin={xMin}
                            xMax={xMax}
                            // yMax={yMax}
                            // aggregation={aggregatedOption}
                            //interventionDate={interventionDate}
                            sortMode={sortMode}
                            showingAttr={showingAttr}
                        />
                    </ChartSVG>

                    <NotationForm notation={notation} chartId={chartId} />

                </Grid.Column>
            </Grid.Row>
        </Grid>
    );
}


export default inject("store")(observer(DumbbellChartVisualization));



// interface ActiveProps {
//     active: boolean;
// }

// const PostopMenuItem = styled(Menu.Item) <ActiveProps>`
//   &&&&&{color: ${props => props.active ? postop_color : third_gray}!important;
//         }
// `

// const PreopMenuItem = styled(Menu.Item) <ActiveProps>`
//  &&&&&{color: ${props => props.active ? preop_color : third_gray}!important;}
// `

// const GapMenuItem = styled(Menu.Item)`
//   &&&&&{color: ${props => props.active ? basic_gray : third_gray}!important;}
//`
const GapButton = styled(Button)`
  &&&&& {color: ${basic_gray}!important;
box - shadow: 0 0 0 1px ${basic_gray} inset!important;}`


const PostopButton = styled(Button)`
   &&&&& {color: ${postop_color}!important;
box - shadow: 0 0 0 1px ${postop_color} inset!important;}`

const PreopButton = styled(Button)`
  &&&&& { color: ${ preop_color} !important;
box - shadow: 0 0 0 1px ${ preop_color} inset!important;}`


// const OptionsP = styled.p`
//   margin-top:5px;
//   margin-bottom:5px;
//   margin-left:1px;
// `