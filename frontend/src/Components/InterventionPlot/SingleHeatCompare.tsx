import React, { FC, useEffect, useCallback } from "react";
import Store from "../../Interfaces/Store";
import styled from "styled-components";
import { inject, observer } from "mobx-react";
import { InterventionDataPoint } from "../../Interfaces/ApplicationState";
// import { Popup } from "semantic-ui-react";
// import { actions } from "../..";
import { ScaleLinear, ScaleOrdinal, ScaleBand, scaleLinear, interpolateReds, scaleBand, interpolateGreys } from "d3";
import { highlight_orange, basic_gray, blood_red, highlight_blue } from "../../ColorProfile";
import { Popup } from "semantic-ui-react";
import { actions } from "../..";

interface OwnProps {
    dataPoint: InterventionDataPoint;
    isSelected: boolean;
    aggregatedBy: string;
    isFiltered: boolean;
    howToTransform: string;
    store?: Store;
    // valueScale: ScaleBand<any>;
    valueScaleDomain: string;
    valueScaleRange: string;
    bandwidth: number;
}

export type Props = OwnProps;

const SingleHeatCompare: FC<Props> = ({ howToTransform, dataPoint, bandwidth, aggregatedBy, isSelected, valueScaleDomain, valueScaleRange, store, isFiltered }: Props) => {

    const { showZero } = store!;
    const colorScale = scaleLinear().domain([0, 1]).range([0.1, 1])

    const valueScale = useCallback(() => {
        const valueScale = scaleBand().domain(JSON.parse(valueScaleDomain)).range(JSON.parse(valueScaleRange)).paddingInner(0.01);
        return valueScale
    }, [valueScaleDomain, valueScaleRange])

    return (
        <>

            {valueScale().domain().map(point => {
                const preOutput = dataPoint.preCountDict[point] ? dataPoint.preCountDict[point] : 0;

                const postOutput = dataPoint.postCountDict[point] ? dataPoint.postCountDict[point] : 0;

                const preCaseCount = showZero ? dataPoint.preCaseCount : dataPoint.preCaseCount - dataPoint.preZeroCaseNum;
                const postCaseCount = showZero ? dataPoint.postCaseCount : dataPoint.postCaseCount - dataPoint.postZeroCaseNum;

                let preFill = preOutput === 0 ? "white" : interpolateReds(colorScale(preOutput / preCaseCount))
                let postFill = postOutput === 0 ? "white" : interpolateReds(colorScale(postOutput / postCaseCount))
                if (!showZero && point as any === 0) {
                    preFill = preOutput === 0 ? "white" : interpolateGreys(preOutput / dataPoint.preCaseCount);
                    postFill = postOutput === 0 ? "white" : interpolateGreys(postOutput / dataPoint.postCaseCount)
                }

                return (
                    [<Popup content={preOutput}
                        key={`Pre${dataPoint.aggregateAttribute} - ${point}`}
                        trigger={
                            <HeatRect
                                fill={preFill}
                                x={valueScale()(point)}
                                y={0}
                                transform={howToTransform}
                                width={valueScale().bandwidth()}
                                height={bandwidth * 0.5}
                                isselected={isSelected}
                                isfiltered={isFiltered}
                                onClick={(e) => {
                                    actions.selectSet(
                                        {
                                            set_name: aggregatedBy,
                                            set_value: [dataPoint.aggregateAttribute]
                                        },
                                        e.shiftKey
                                    )
                                }} />}
                    />, <Popup content={postOutput}
                        key={`Post${dataPoint.aggregateAttribute} - ${point}`}
                        trigger={
                            <HeatRect
                                fill={postFill}
                                x={valueScale()(point)}
                                y={bandwidth * 0.5}
                                transform={howToTransform}
                                width={valueScale().bandwidth()}
                                height={bandwidth * 0.5}
                                isselected={isSelected}
                                isfiltered={isFiltered}
                                onClick={(e) => {
                                    actions.selectSet(
                                        {
                                            set_name: aggregatedBy,
                                            set_value: [dataPoint.aggregateAttribute]
                                        },
                                        e.shiftKey
                                    )
                                }} />}
                    />,
                    <line
                        transform={howToTransform}
                        strokeWidth={0.5}
                        stroke={basic_gray}
                        opacity={preOutput === 0 ? 1 : 0}
                        y1={0.25 * bandwidth}
                        y2={0.25 * bandwidth}
                        x1={valueScale()(point)! + 0.35 * valueScale().bandwidth()}
                        x2={valueScale()(point)! + 0.65 * valueScale().bandwidth()} />,
                    <line
                        transform={howToTransform}
                        strokeWidth={0.5}
                        stroke={basic_gray}
                        opacity={postOutput === 0 ? 1 : 0}
                        y1={0.75 * bandwidth}
                        y2={0.75 * bandwidth}
                        x1={valueScale()(point)! + 0.35 * valueScale().bandwidth()}
                        x2={valueScale()(point)! + 0.65 * valueScale().bandwidth()} />]
                )
            })},
            <line transform={howToTransform} x1={valueScale().range()[0]} x2={valueScale().range()[1]} y1={bandwidth * 0.5} y2={bandwidth * 0.5}
                stroke="white" />
        </>)

}

export default inject("store")(observer(SingleHeatCompare));

interface HeatRectProp {
    isselected: boolean;
    isfiltered: boolean;
}

const HeatRect = styled(`rect`) <HeatRectProp>`
    
    opacity:0.6;
    stroke: ${props => (props.isselected ? highlight_blue : (props.isfiltered ? highlight_orange : "none"))};
    stroke-width:3;
  `;
