import React, { FC, useState, useEffect } from 'react';
import { inject, observer } from 'mobx-react';
import Store from './Interfaces/Store';
import { LayoutElement } from './Interfaces/ApplicationState';
import { Button, Tab, Grid, GridColumn, Container, Modal, Message, Icon, Menu, Checkbox } from 'semantic-ui-react';
import { actions } from '.';
import DumbbellChartVisualization from './Components/DumbbellChart/DumbbellChartVisualization';
import BarChartVisualization from './Components/BarChart/BarChartVisualization';
import ScatterPlotVisualization from './Components/Scatterplot/ScatterPlotVisualization';
import HeatMapVisualization from './Components/HeatMapChart/HeatMapVisualization';
import InterventionPlotVisualization from './Components/InterventionPlot/InterventionPlotVisualization';
import DetailView from './Components/Utilities/DetailView';
import LineUpWrapper from './Components/LineUpWrapper';
import PatientComparisonWrapper from './Components/PatientComparisonWrapper';
import UserControl from './Components/Utilities/UserControl';
import SideBar from './Components/Utilities/SideBar';
import styled from 'styled-components';
import { Responsive, WidthProvider } from "react-grid-layout";
import './App.css'
import 'react-grid-layout/css/styles.css'
import { NavLink } from 'react-router-dom';

interface OwnProps {
    store?: Store
}
type Props = OwnProps;

const Preview: FC<Props> = ({ store }: Props) => {

    const { layoutArray, dateRange, showZero } = store!;

    const [hemoData, setHemoData] = useState<any>([])

    const [loadingModalOpen, setloadingModalOpen] = useState(true)

    async function cacheHemoData() {
        const resHemo = await fetch("http://localhost:8000/api/hemoglobin");
        const dataHemo = await resHemo.json();
        const resultHemo = dataHemo.result;
        const resTrans = await fetch(`http://localhost:8000/api/request_transfused_units?transfusion_type=ALL_UNITS&date_range=${dateRange}`)
        const dataTrans = await resTrans.json();
        let transfused_dict = {} as any;

        let result: {
            CASE_ID: number,
            VISIT_ID: number,
            PATIENT_ID: number,
            ANESTHOLOGIST_ID: number,
            SURGEON_ID: number,
            YEAR: number,
            QUARTER: string,
            MONTH: string,
            DATE: Date | null,
            PRBC_UNITS: number,
            FFP_UNITS: number,
            PLT_UNITS: number,
            CRYO_UNITS: number,
            CELL_SAVER_ML: number,
            HEMO: number[]
        }[] = [];


        dataTrans.forEach((element: any) => {
            transfused_dict[element.case_id] = {
                PRBC_UNITS: element.transfused_units[0] || 0,
                FFP_UNITS: element.transfused_units[1] || 0,
                PLT_UNITS: element.transfused_units[2] || 0,
                CRYO_UNITS: element.transfused_units[3] || 0,
                CELL_SAVER_ML: element.transfused_units[4] || 0
            };
        });

        resultHemo.map((ob: any, index: number) => {
            if (transfused_dict[ob.CASE_ID]) {
                const transfusedResult = transfused_dict[ob.CASE_ID];
                result.push({
                    CASE_ID: ob.CASE_ID,
                    VISIT_ID: ob.VISIT_ID,
                    PATIENT_ID: ob.PATIENT_ID,
                    ANESTHOLOGIST_ID: ob.ANESTHOLOGIST_ID,
                    SURGEON_ID: ob.SURGEON_ID,
                    YEAR: ob.YEAR,
                    PRBC_UNITS: transfusedResult.PRBC_UNITS,
                    FFP_UNITS: transfusedResult.FFP_UNITS,
                    PLT_UNITS: transfusedResult.PLT_UNITS,
                    CRYO_UNITS: transfusedResult.CRYO_UNITS,
                    CELL_SAVER_ML: transfusedResult.CELL_SAVER_ML,
                    HEMO: ob.HEMO,
                    QUARTER: ob.QUARTER,
                    MONTH: ob.MONTH,
                    DATE: ob.DATE
                })
            }
        })

        result = result.filter((d: any) => d);
        console.log("hemo data done")
        setHemoData(result)
        setloadingModalOpen(false)

    }

    useEffect(() => {
        cacheHemoData();
    }, []);


    const createElement = (layout: LayoutElement, index: number) => {
        switch (layout.plot_type) {
            case "DUMBBELL":
                return (
                    <div key={layout.i} className={"parent-node" + layout.i}>

                        <Button icon="close" floated="right" circular compact size="mini" basic onClick={() => { actions.removeChart(layout.i) }} />
                        <DumbbellChartVisualization
                            yAxis={layout.aggregatedBy}
                            w={layout.w}
                            chartId={layout.i}
                            chartIndex={index}
                            hemoglobinDataSet={hemoData}
                            notation={layout.notation}
                        //     interventionDate={layout.interventionDate}
                        // aggregatedOption={layout.aggregation}
                        />
                    </div>
                );
            case "VIOLIN":
                return (
                    <div
                        //onClick={this.onClickBlock.bind(this, layoutE.i)}
                        key={layout.i}
                        className={"parent-node" + layout.i}
                    // data-grid={layoutE}
                    >

                        <Button floated="right" icon="close" circular compact size="mini" basic onClick={() => { actions.removeChart(layout.i) }} />
                        <BarChartVisualization
                            hemoglobinDataSet={hemoData}
                            w={layout.w}
                            aggregatedBy={layout.aggregatedBy}
                            valueToVisualize={layout.valueToVisualize}
                            // class_name={"parent-node" + layoutE.i}
                            chartId={layout.i}
                            chartIndex={index}
                            extraPair={layout.extraPair}
                            notation={layout.notation}
                        />
                    </div>
                );
            case "SCATTER":
                return (<div
                    //onClick={this.onClickBlock.bind(this, layoutE.i)}
                    key={layout.i}
                    className={"parent-node" + layout.i}
                // data-grid={layoutE}
                >

                    <Button floated="right" icon="close" size="mini" circular compact basic onClick={() => { actions.removeChart(layout.i) }} />
                    <ScatterPlotVisualization
                        xAxis={layout.aggregatedBy}
                        w={layout.w}
                        yAxis={layout.valueToVisualize}
                        hemoglobinDataSet={hemoData}
                        // class_name={"parent-node" + layoutE.i}
                        chartId={layout.i}
                        chartIndex={index}

                        notation={layout.notation}
                    />
                </div>);

            case "HEATMAP":
                return (<div
                    //onClick={this.onClickBlock.bind(this, layoutE.i)}
                    key={layout.i}
                    className={"parent-node" + layout.i}
                // data-grid={layoutE}
                >

                    <Button floated="right" icon="close" size="mini" circular compact basic onClick={() => { actions.removeChart(layout.i) }} />
                    <HeatMapVisualization
                        hemoglobinDataSet={hemoData}
                        w={layout.w}
                        aggregatedBy={layout.aggregatedBy}
                        valueToVisualize={layout.valueToVisualize}
                        // class_name={"parent-node" + layoutE.i}
                        chartId={layout.i}
                        chartIndex={index}
                        extraPair={layout.extraPair}
                        notation={layout.notation}
                    />
                </div>);

            case "INTERVENTION":
                return (<div key={layout.i}
                    className={"parent-node" + layout.i}>
                    <Button floated="right" icon="close" size="mini" circular compact basic onClick={() => { actions.removeChart(layout.i) }} />
                    <InterventionPlotVisualization
                        extraPair={layout.extraPair}
                        w={layout.w}
                        hemoglobinDataSet={hemoData}
                        aggregatedBy={layout.aggregatedBy}
                        valueToVisualize={layout.valueToVisualize}
                        chartId={layout.i}
                        chartIndex={index}
                        interventionDate={layout.interventionDate!}
                        interventionPlotType={layout.interventionType!}
                        notation={layout.notation} />
                </div>);

        }

    }

    const colData = {
        lg: 2,
        md: 2,
        sm: 2,
        xs: 2,
        xxs: 2
    };

    const generateGrid = () => {
        let output = layoutArray.map(d => ({ w: d.w, h: d.h, x: d.x, y: d.y, i: d.i }))
        const newStuff = output.map(d => ({ ...d }))
        return newStuff
    }

    const panes = [{
        menuItem: 'Main', pane: <Tab.Pane key="Main">
            <Grid>
                <GridColumn width={13}>
                    <Responsive
                        onResizeStop={actions.onLayoutchange}
                        onDragStop={actions.onLayoutchange}
                        // onLayoutChange={actions.onLayoutchange}
                        // onBreakpointChange={this._onBreakpointChange}
                        className="layout"
                        cols={colData}
                        rowHeight={500}
                        width={1300}
                        //cols={2}
                        //breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}

                        layouts={{ md: generateGrid(), lg: generateGrid(), sm: generateGrid(), xs: generateGrid(), xxs: generateGrid() }}
                    >
                        {layoutArray.map((layoutE, i) => {
                            return createElement(layoutE, i);
                        })}
                    </Responsive>
                </GridColumn>
                <Grid.Column width={3}>
                    <DetailView />
                </Grid.Column>
            </Grid>
        </Tab.Pane >
    },
    {
        menuItem: 'LineUp', pane:
            <Tab.Pane key="LineUp">
                <div className={"lineup"}>
                    <LineUpWrapper hemoglobinDataSet={hemoData} /></div></Tab.Pane>
    }, {
        menuItem: 'Selected Patients',
        pane:
            <Tab.Pane key="Patients">
                <PatientComparisonWrapper></PatientComparisonWrapper>

            </Tab.Pane>
    }]

    return (
        <LayoutDiv>
            <Container fluid>
                <Menu widths={3}>
                    <Menu.Item>
                        <Checkbox
                            checked={showZero}
                            onClick={actions.toggleShowZero}
                            label={<label> Show Zero Transfused </label>}
                        />
                    </Menu.Item>
                    <Menu.Item>
                        <NavLink component={Button} to="/dashboard" >
                            Customize Mode
                </NavLink>
                    </Menu.Item>
                    <Menu.Item>
                        <NavLink component={Button} to="/" onClick={() => { store!.isLoggedIn = false; }} >
                            Log Out
                    </NavLink>
                    </Menu.Item>
                </Menu>
            </Container>
            <Grid padded>
                <SpecialPaddingColumn width={3} >
                    <SideBar></SideBar>
                </SpecialPaddingColumn>
                <Grid.Column width={13}>
                    <Tab panes={panes}
                        renderActiveOnly={false}
                    ></Tab>
                </Grid.Column>

            </Grid>
            <Modal open={loadingModalOpen} closeOnEscape={false}
                closeOnDimmerClick={false}>
                <Message icon>
                    <Icon name='circle notched' loading />
                    <Message.Content>
                        <Message.Header>Just one second</Message.Header>
                        We are fetching required data.
                        </Message.Content>
                </Message>

            </Modal>
        </LayoutDiv>

    );

}

export default inject('store')(observer(Preview))
const LayoutDiv = styled.div`
  width: 100vw;
  height: 100vh;
`;

const SpecialPaddingColumn = styled(Grid.Column)`
  &&&&&{padding-left:5px;}
`;