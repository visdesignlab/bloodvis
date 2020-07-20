import React, { FC, useEffect, useState, useRef } from "react";
import { inject, observer } from "mobx-react";
import Store from "../Interfaces/Store";

//import * as LineUpJS from "lineupjsx";
// import { LineUpStringColumnDesc, LineUp, LineUpCategoricalColumnDesc, LineUpNumberColumnDesc } from "lineupjsx";
import * as LineUpJS from "lineupjs"
import "lineupjs/build/LineUpJS.css";
import $ from 'jquery';

import { BloodProductCap, stateUpdateWrapperUseJSON } from "../PresetsProfile";
import { actions } from "..";

interface OwnProps {
    hemoglobinDataSet: any;
    store?: Store;
}

export type Props = OwnProps;

const LineUpWrapper: FC<Props> = ({ hemoglobinDataSet, store }: Props) => {

    const componentRef = useRef<HTMLElement>()

    // const lineupvariable = LineUpJS.builder
    const { currentSelectPatientGroup } = store!
    const [distinctCategories, setCatgories] = useState<{ surgeons: any[], anesth: any[], patient: any[] }>({ surgeons: [], anesth: [], patient: [] })
    const [caseIDReference, setCaseIDList] = useState<any>({})
    const [convertedData, setConvertedData] = useState<any[]>([])
    //const [caseIDArray, setCaseIDArray] = useState<number[]>([])

    useEffect(() => {

        if (hemoglobinDataSet) {
            let distinctSurgeons = new Set();
            let distinctAnesth = new Set();
            let distinctPatient = new Set();
            let caseIDArray: number[] = []
            let caseIDDict: any = {}
            let tempData = hemoglobinDataSet
            hemoglobinDataSet.map((ob: any, index: number) => {
                caseIDDict[ob.CASE_ID] = index;
                distinctAnesth.add((ob.ANESTHESIOLOGIST_ID).toString());
                distinctSurgeons.add((ob.SURGEON_ID).toString());
                distinctPatient.add(ob.PATIENT_ID.toString());
                caseIDArray.push(ob.CASE_ID)

            })
            stateUpdateWrapperUseJSON(distinctCategories, { surgeons: (Array.from(distinctSurgeons)), anesth: Array.from(distinctAnesth), patient: Array.from(distinctPatient) }, setCatgories)
            stateUpdateWrapperUseJSON(caseIDReference, caseIDDict, setCaseIDList)

        }
    }, [hemoglobinDataSet])

    const outputSelectedGroup = () => {

        const dataIndicies = currentSelectPatientGroup.map(d => caseIDReference[d])
        return dataIndicies
    }


    //TODO make the line up side bar on the main instead of on a seperate tab. 
    //

    useEffect(() => {
        $(document).ready(function () {
            const node = document.getElementById("lineup-wrapper")
            if (node && hemoglobinDataSet.length > 0 && distinctCategories.surgeons.length > 0) {
                if (!(node.getElementsByClassName("lu-side-panel").length > 0)) {
                    const lineup = LineUpJS.builder(hemoglobinDataSet)
                        .column(LineUpJS.buildStringColumn("CASE_ID"))
                        .column(LineUpJS.buildCategoricalColumn("SURGEON_ID").categories(distinctCategories.patient))
                        .column(LineUpJS.buildStringColumn("HEMO"))
                        .column(LineUpJS.buildCategoricalColumn('VENT').categories(["0", "1"]))
                        .column(LineUpJS.buildCategoricalColumn("DEATH").categories(["0", "1"]))
                        .column(LineUpJS.buildDateColumn("DATE"))
                        .column(LineUpJS.buildNumberColumn("DRG_WEIGHT", [0, 30]))
                        .column(LineUpJS.buildCategoricalColumn("YEAR").categories(["2014", "2015", "2016", "2017", "2018", "2019"]))
                        .column(LineUpJS.buildCategoricalColumn("ANESTHESIOLOGIST_ID").categories(distinctCategories.anesth))
                        .column(LineUpJS.buildCategoricalColumn("SURGEON_ID").categories(distinctCategories.surgeons))
                        .column(LineUpJS.buildNumberColumn("PRBC_UNITS", [0, BloodProductCap.PRBC_UNITS]))
                        .column(LineUpJS.buildNumberColumn("FFP_UNITS", [0, BloodProductCap.FFP_UNITS]))
                        .column(LineUpJS.buildNumberColumn("PLT_UNITS", [0, BloodProductCap.PLT_UNITS]))
                        .column(LineUpJS.buildNumberColumn("CRYO_UNITS", [0, BloodProductCap.CRYO_UNITS]))
                        .column(LineUpJS.buildNumberColumn("CELL_SAVER_ML", [0, BloodProductCap.CELL_SAVER_ML]))
                        .build(node);

                    lineup.data.getFirstRanking().on("filterChanged", (previous, current) => {
                        //Solution to not return the group order after the filter applied. a Time Out.
                        setTimeout(() => {
                            const filter_output = lineup.data.getFirstRanking().getGroups()[0].order

                            const caseIDList = filter_output.map(v => hemoglobinDataSet[v].CASE_ID)
                            actions.updateSelectedPatientGroup(caseIDList)
                            console.log(caseIDList)
                        }, 1000)
                        // console.log(previous, current); // filter settings
                        // console.log(lineup.data.getFirstRanking().getGroups())
                        // console.log(lineup.data); // DataProvider
                        // console.log(lineup.data.getFirstRanking()); // First ranking

                        // setTimeout(() => { console.log(lineup.data.getFirstRanking().getGroups()) }, 2000)
                    });

                }
            }
        })

    }, [distinctCategories, hemoglobinDataSet])



    return <></>
}

export default inject("store")(observer(LineUpWrapper))