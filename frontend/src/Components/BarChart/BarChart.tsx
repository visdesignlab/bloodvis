import React, {
  FC,
  useEffect,
  useRef,
  useLayoutEffect,
  useState,
  useMemo
} from "react";
import { actions } from "../..";
import Store from "../../Interfaces/Store";
import styled from "styled-components";
import { inject, observer } from "mobx-react";
import {
  select,
  selectAll,
  scaleLinear,
  scaleBand,
    mouse,
  max,
  axisBottom,
  axisLeft,
  axisTop
} from "d3";
import {
  SingularDataPoint,
  offset,
  AxisLabelDict
} from "../../Interfaces/ApplicationState";
import {Popup} from 'semantic-ui-react'

interface OwnProps{
  aggregatedBy: string;
  valueToVisualize: string;
    // chartId: string;
    store?: Store;
    dimension: { width: number, height: number } 
  data: SingularDataPoint[];
  svg: React.RefObject<SVGSVGElement>;
  yMax: number
  selectedVal:number|null
}

export type Props = OwnProps;

const BarChart: FC<Props> = ({ store, aggregatedBy, valueToVisualize, dimension, data, svg,yMax ,selectedVal}: Props) => {

    const svgSelection = select(svg.current);
    
    const {
      perCaseSelected,
      currentSelectSet
    } = store!;
  
    const [aggregationScale, valueScale] = useMemo(() => {
        // const yMax = max(data.map(d=>d.yVal))||0
        const xVals = data
            .map(function(dp) {
            return dp.xVal;
            })
            .sort();
        let valueScale = scaleLinear()
            .domain([0, 1.1 * yMax])
          .range([offset.left, dimension.width - offset.right - offset.margin]);
    let aggregationScale = scaleBand()
                .domain(xVals)
      .range([dimension.height - offset.bottom, offset.top])
                .paddingInner(0.1);
        return [aggregationScale, valueScale];
        },[dimension,data,yMax])

  const aggregationLabel = axisLeft(aggregationScale);
  const yAxisLabel = axisTop(valueScale);
  
            svgSelection
              .select(".axes")
              .select(".x-axis")
              .attr(
                "transform",
                `translate(${offset.left}, 0)`
              )
              .call(aggregationLabel as any)
              .selectAll("text")
              // .attr("y", 0)
              // .attr("x", 9)
              // .attr("dy", ".35em")
           //   .attr("transform", "rotate(90)")
        //      .style("text-anchor", "start");

            svgSelection
              .select(".axes")
              .select(".y-axis")
              .attr(
                "transform",
                `translate(0 ,${offset.top} )`
              )
              .call(yAxisLabel as any);

        svgSelection
          .select(".axes")
          .select(".x-label")
          .attr("x", 0.5 * (dimension.width + offset.left))
          .attr("y", 0)
          .attr("alignment-baseline", "hanging")
          .attr("font-size", "11px")
          .attr("text-anchor", "middle")
          //.attr("transform", "rotate(90)")
          .text(() =>{
            const trailing = perCaseSelected ? " / Case" : "";
            return AxisLabelDict[valueToVisualize] ? AxisLabelDict[valueToVisualize] + trailing : valueToVisualize + trailing
          }
          );

        svgSelection
          .select(".axes")
          .select(".y-label")
          .attr("y", 0)
          .attr("x", -0.5 * dimension.height + 1.5*offset.bottom)
          .attr("font-size", "11px")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "hanging")
          .attr("transform", "rotate(-90)")
          .text(
            AxisLabelDict[aggregatedBy] ? AxisLabelDict[aggregatedBy] : aggregatedBy
            
        );
  
  const decideIfSelected = (d: SingularDataPoint) => {
    if (selectedVal) {
      return selectedVal === d.xVal
    }
    else if (currentSelectSet) {
      return currentSelectSet.set_name === aggregatedBy && currentSelectSet.set_value === d.xVal;
    }
    else {
      return false;
    }
  }
    return (
    <>
    <g className="axes">
        <g className="x-axis"></g>
        <g className="y-axis"></g>
        <text className="x-label" style={{ textAnchor: "end" }} />
        <text className="y-label" style={{textAnchor:"end"}}/>
      </g>
        <g className="chart"
          transform={`translate(${offset.left},0)`}
        >
          {data.map((dataPoint) => {
            return (
              <Popup content={dataPoint.yVal} key={dataPoint.xVal} trigger={
                <Bar
                  x={0}
                  y={aggregationScale(dataPoint.xVal)}
                  width={valueScale(dataPoint.yVal)-offset.left}
                  height={aggregationScale.bandwidth()}
                  onClick={() => {
                    actions.selectSet({ set_name: aggregatedBy, set_value: dataPoint.xVal })
                  }}
                isSelected={decideIfSelected(dataPoint)}
              />}
            />
          );
        })}
      </g>
      <g className="rect-tooltip" style={{display:"none"}}>
        <rect fill="white" style={{ opacity: "0.5", width: "30", height: "20" }} />
        <text x="15" dy="1.2em" style={{textAnchor:"middle", fontSize:"12px",fontWeight:"bold"}}/>
      </g>
        </>
    );
}
export default inject("store")(observer(BarChart));

interface BarProps{
  isSelected: boolean;
}
const Bar = styled(`rect`)<BarProps>`
   fill:${props => (props.isSelected ? '#d98532' : '#20639B')}
`;