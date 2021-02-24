import React, {
    FC,
    useEffect,
    useState,
    useCallback
} from "react";
import Store from "../../Interfaces/Store";
import { inject, observer } from "mobx-react";
import {
    select,
    scaleLinear,
    scaleBand,
    sum,
    axisLeft,
    axisBottom,
    timeFormat
} from "d3";
import {
    CostBarChartDataPoint, CostCompareChartDataPoint, ExtraPairPoint
} from "../../Interfaces/ApplicationState";
import {
    offset,
    AcronymDictionary,
    extraPairPadding,
    differentialSquareWidth,
    postop_color,
    preop_color,
} from "../../PresetsProfile"
import { stateUpdateWrapperUseJSON } from "../../HelperFunctions";
import SingleCompareBars from "./SingleCompareBars";
import { ComparisonDiv } from "../InterventionPlot/ComparisonPlot";

interface OwnProps {
    aggregatedBy: string;
    valueToCompare: string;
    chartId: string;
    store?: Store;
    dimensionWidth: number,
    dimensionHeight: number,
    data: CostCompareChartDataPoint[];
    svg: React.RefObject<SVGSVGElement>;
    maximumCost: number;
    costMode: boolean
    //  selectedVal: number | null;
    // stripPlotMode: boolean;
    //extraPairDataSet: ExtraPairPoint[];
}



export type Props = OwnProps;

const CompareSavingChart: FC<Props> = ({ maximumCost, store, valueToCompare, aggregatedBy, dimensionWidth, dimensionHeight, data, svg, chartId, costMode }: Props) => {
    const svgSelection = select(svg.current);
    const currentOffset = offset.regular;
    const [withInterTotal, setWithInterTotal] = useState(0);
    const [withoutInterTotal, setWithoutInterTotal] = useState(0)
    const [xVals, setXVals] = useState([]);

    useEffect(() => {
        let newWithInterTotal = 0;
        let newWithoutInterTotal = 0;
        const tempXVals = data.sort((a, b) => {
            if (aggregatedBy === "YEAR") {
                return a.aggregateAttribute - b.aggregateAttribute
            } else {
                return a.caseNum - b.caseNum
            }
        }).map((dp) => {
            newWithInterTotal += dp.withInterCaseNum;
            newWithoutInterTotal += dp.caseNum;
            return dp.aggregateAttribute
        });
        setWithInterTotal(newWithInterTotal)
        setWithoutInterTotal(newWithoutInterTotal)
        stateUpdateWrapperUseJSON(xVals, tempXVals, setXVals);
    }, [data, aggregatedBy])

    const aggregationScale = useCallback(() => {
        const aggregationScale = scaleBand()
            .domain(xVals)
            .range([dimensionHeight - currentOffset.bottom, currentOffset.top])
            .paddingInner(0.15);
        return aggregationScale
    }, [dimensionHeight, xVals]);

    const valueScale = useCallback(() => {
        let valueScale = scaleLinear()
            .domain([0, maximumCost])
            .range([currentOffset.left, dimensionWidth - currentOffset.right - currentOffset.margin])
        return valueScale
    }, [dimensionWidth, maximumCost])

    svgSelection
        .select(".axes")
        .select(".x-axis")
        .attr(
            "transform",
            `translate(${currentOffset.left}, 0)`
        )
        .call(axisLeft(aggregationScale()) as any)
        .selectAll("text")
        .attr("transform", `translate(-35,0)`)

    svgSelection
        .select(".axes")
        .select(".y-axis")
        .attr(
            "transform",
            `translate(0,${dimensionHeight - currentOffset.bottom})`
        )
        .call(axisBottom(valueScale()) as any);

    svgSelection
        // .select(".axes")
        .select(".x-label")
        .attr("x", dimensionWidth * 0.5 + currentOffset.margin)
        .attr("y", dimensionHeight - currentOffset.bottom + 20)
        .attr("alignment-baseline", "hanging")
        .attr("font-size", "11px")
        .attr("text-anchor", "middle")
        .text(costMode ? "Per Case Cost in Dollars" : "Units per Case");

    svgSelection
        //.select(".axes")
        .select(".y-label")
        .attr("y", dimensionHeight - currentOffset.bottom + 20)
        .attr("x", currentOffset.left - 55)
        .attr("font-size", "11px")
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "hanging")
        .text(
            AcronymDictionary[aggregatedBy] ? AcronymDictionary[aggregatedBy] : aggregatedBy
        );

    return <>
        <g className="axes">
            <g className="x-axis"></g>
            <g className="y-axis"></g>
            <text className="x-label" />
            <text className="y-label" />
        </g>
        <g>
            <g transform="translate(0,4)">
                <rect x={0.2 * (dimensionWidth)}
                    y={0}
                    width={differentialSquareWidth}
                    height={12}
                    fill={preop_color}
                    opacity={0.65} />
                <rect x={0.2 * (dimensionWidth)}
                    y={12}
                    width={differentialSquareWidth}
                    height={12}
                    fill={postop_color}
                    opacity={0.65} />
                <text
                    x={0.2 * (dimensionWidth) + differentialSquareWidth + 1}
                    y={6}
                    alignmentBaseline={"middle"}
                    textAnchor={"start"}
                    fontSize="11px"
                    fill={"black"}>
                    {` True ${withInterTotal}/${withInterTotal + withoutInterTotal}`}
                </text>
                <text
                    x={0.2 * (dimensionWidth) + differentialSquareWidth + 1}
                    y={18}
                    alignmentBaseline={"middle"}
                    textAnchor={"start"}
                    fontSize="11px"
                    fill={"black"}>
                    {`False ${withoutInterTotal}/${withInterTotal + withoutInterTotal}`}
                </text>
            </g>
            <foreignObject x={0.0 * (dimensionWidth)} y={0} width={0.2 * dimensionWidth} height={currentOffset.top}>
                <ComparisonDiv>Comparing:</ComparisonDiv>
                <ComparisonDiv>{(AcronymDictionary[valueToCompare || ""]) || valueToCompare}</ComparisonDiv>
            </foreignObject>
        </g>
        <g className="chart">
            {data.map((dp) => {
                return (<SingleCompareBars
                    valueScaleDomain={JSON.stringify(valueScale().domain())}
                    valueScaleRange={JSON.stringify(valueScale().range())}
                    dataPoint={dp}
                    // aggregatedBy={aggregatedBy}
                    costMode={costMode}
                    bandwidth={aggregationScale().bandwidth()}
                    howToTransform={(`translate(0,${aggregationScale()(
                        dp.aggregateAttribute
                    )})`).toString()}
                />)
            })}
        </g>
    </>
}
export default inject("store")(observer(CompareSavingChart));

// const ExtraPairText = styled(`text`)`
//   font-size: 11px
//   text-anchor: middle
//   alignment-baseline:hanging
//   cursor:pointer
// `
