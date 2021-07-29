import React, {Component} from 'react';
import axios from "axios";
import { Row, Col } from 'antd';
import SatSetting from './SatSetting';
import SatelliteList from "./SatelliteList";
import {NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY} from "../constants";
import WorldMap from "./WorldMap";

class Main extends Component {
    state = {
        satInfo: null,
        satList: null,
        setting: null,
        isLoadingList: false

    }

    render() {
        const { satInfo, isLoadingList, satList, setting } = this.state;
        return (
            <Row className="main">
                <Col span={8} className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList
                        satInfo={satInfo}
                        isLoading={isLoadingList}
                        onShowMap={this.showMap}
                    />
                </Col>

                <Col span={16} className="right-side">
                    <WorldMap satData={satList} observerData={setting} />
                </Col>
            </Row>
        );
    }

    showMap = selected => {
        this.setState(preState => ({
            ...preState,
            satList: [...selected]
        }));
    };

    showNearbySatellite = (setting) => {
        this.setState({
            isLoadingList: true,
            setting: setting
        });
        this.fetchSatellite(setting);
    };

    fetchSatellite = (setting) => {
        // step1: get settings
        const {latitude, longitude, elevation, altitude} = setting;
        // set loading flag
        this.setState( {
            isLoadingList: true,
        })

        // step2: prepare for option for request
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${"YCYD6N8-YGJ53W-ZPN35U-4NWG"}`;

        axios.get(url)
            .then(response => {
                console.log('res -> ', response);
                const { data } = response;
                this.setState({
                        satInfo: data,
                        isLoadingList: false
                })
            })
            .catch(err => {
                console.log('err in fetch satellite -> ', err)
            })
    }

    // showMap = () => {
    //     console.log('show on the map');
    // }


}

export default Main;
