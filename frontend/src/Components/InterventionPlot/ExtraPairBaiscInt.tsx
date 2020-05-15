import React, { FC, useEffect, useMemo } from "react";
import Store from "../../Interfaces/Store";
import styled from "styled-components";
import { inject, observer } from "mobx-react";
import { ScaleBand, scaleOrdinal, range, scaleLinear, ScaleOrdinal, max, format, interpolateGreys } from "d3";
import { extraPairWidth } from "../../Interfaces/ApplicationState"
import { Popup } from "semantic-ui-react";
import { secondary_gray } from "../../ColorProfile";

interface OwnProps {
    totalData: any[];
    preIntData: any[];
    postIntData: any[];
    aggregatedScale: ScaleBand<string>;
    //yMax:number;
    store?: Store;
}

export type Props = OwnProps;

const ExtraPairBasicInt: FC<Props> = ({ totalData, preIntData, postIntData, aggregatedScale, store }: Props) => {
    // const [valueScale] = useMemo(() => {
    //     //console.log(dataSet)
    //     const valueScale = scaleLinear().domain([0, 1]).range([0.25, 0.8])

    //     return [valueScale];
    // }, [])

    const outputText = () => {
        let output = [];
        if (aggregatedScale.bandwidth() > 40) {
            output = Object.entries(preIntData).map(([val, dataVal]) => {
                console.log(val, dataVal)
                return (
                    [<Popup
                        content={format(".4r")(dataVal)}
                        trigger={
                            <rect
                                x={0}
                                y={aggregatedScale(val)}
                                // fill={interpolateGreys(caseScale(dataPoint.caseCount))}
                                // fill={interpolateGreys(valueScale(dataVal))}
                                fill={secondary_gray}
                                opacity={0.8}
                                width={extraPairWidth.Basic}
                                height={aggregatedScale.bandwidth() * 0.5} />
                        } />,

                    <text x={extraPairWidth.Basic * 0.5}
                        y={
                            aggregatedScale(val)! +
                            0.25 * aggregatedScale.bandwidth()
                        }
                        fill="white"
                        alignmentBaseline={"central"}
                        textAnchor={"middle"}>{format(".0%")(dataVal)}</text>]
                )
            })
            output = output.concat(Object.entries(postIntData).map(([val, dataVal]) => {
                // console.log(val, dataVal)
                return (
                    [<Popup
                        content={format(".4r")(dataVal)}
                        trigger={
                            <rect
                                x={0}
                                y={aggregatedScale(val)! + 0.5 * aggregatedScale.bandwidth()}
                                // fill={interpolateGreys(caseScale(dataPoint.caseCount))}
                                // fill={interpolateGreys(valueScale(dataVal))}
                                fill={secondary_gray}
                                opacity={0.8}
                                width={extraPairWidth.Basic}
                                height={aggregatedScale.bandwidth() * 0.5} />
                        } />,

                    <text x={extraPairWidth.Basic * 0.5}
                        y={
                            aggregatedScale(val)! +
                            0.75 * aggregatedScale.bandwidth()
                        }
                        fill="white"
                        alignmentBaseline={"central"}
                        textAnchor={"middle"}>{format(".0%")(dataVal)}</text>]


                )
            }))
        } else {
            output = Object.entries(totalData).map(([val, dataVal]) => {
                console.log(val, dataVal)
                return (
                    [<Popup
                        content={format(".4r")(dataVal)}
                        trigger={
                            <rect
                                x={0}
                                y={aggregatedScale(val)}
                                // fill={interpolateGreys(caseScale(dataPoint.caseCount))}
                                // fill={interpolateGreys(valueScale(dataVal))}
                                fill={secondary_gray}
                                opacity={0.8}
                                width={extraPairWidth.Basic}
                                height={aggregatedScale.bandwidth()} />
                        } />,

                    <text x={extraPairWidth.Basic * 0.5}
                        y={
                            aggregatedScale(val)! +
                            0.5 * aggregatedScale.bandwidth()
                        }
                        fill="white"
                        alignmentBaseline={"central"}
                        textAnchor={"middle"}>{format(".0%")(dataVal)}</text>]


                )
            })
        }
        return output
    }

    return (
        <>
            {outputText()}
        </>
    )
}

export default inject("store")(observer(ExtraPairBasicInt));