import React, {Component} from 'react';
import { feature } from 'topojson-client';
import axios from 'axios';
import { Spin } from "antd";
import { geoKavrayskiy7 } from 'd3-geo-projection';
import { geoGraticule, geoPath } from 'd3-geo';
import { select as d3Select } from 'd3-selection';
import { schemeCategory10 } from "d3-scale-chromatic";
import * as d3Scale from "d3-scale";
import { timeFormat as d3TimeFormat } from "d3-time-format";


import { WORLD_MAP_URL, SATELLITE_POSITION_URL, SAT_API_KEY } from "../constants";

const width = 960;
const height = 600;

class WorldMap extends Component {
    constructor(){
        super();
        this.map = null;
        this.color = d3Scale.scaleOrdinal(schemeCategory10);
        this.refMap = React.createRef();
        this.refTrack = React.createRef();
        this.state = {
            isLoading: false,
            isDrawing: false
        };

    }

    componentDidMount() {
        axios.get(WORLD_MAP_URL)
            .then(res => {
                const { data } = res;
                // draw map
                const land = feature(data, data.objects.countries).features;
                this.generateMap(land);
            })
            .catch(e => {
                console.log('err in fetch world map data ', e)
            });
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.satData !== this.props.satData) {
            // fetch satellite data
            const {
                latitude,
                longitude,
                elevation,
                altitude,
                duration
            } = this.props.observerData;
            const endTime = duration * 60;   // 打点加速操作

            this.setState({
                isLoading: true
            });

            const urls = this.props.satData.map(sat => {
                const { satid } = sat;
                const url = `/api/${SATELLITE_POSITION_URL}/${satid}/${latitude}/${longitude}/${elevation}/${endTime}/&apiKey=${SAT_API_KEY}`;
                return axios.get(url);
            });

            Promise.all(urls)
                .then(results => {
                    this.setState({
                        isLoading: false,
                        isDrawing: true
                    });
                    console.log(results);
                    const arr = results.map(res => res.data);

                    // tracking satellite
                    // this.track(arr);

                    if (!prevState.isDrawing) {
                        this.track(arr);
                    } else {
                        const oHint = document.getElementsByClassName("hint")[0];
                        oHint.innerHTML =
                            "Please wait for these satellite animation to finish before selection new ones!";
                    }
                })
                .catch(e => {
                    console.log("err in fetch satellite position -> ", e);
                });
        }
    }

    track = data => {
        if (!data[0].hasOwnProperty("positions")) {
            throw new Error("no position data");
            return;
        }

        const len = data[0].positions.length;
        const { duration } = this.props.observerData;
        const { context2 } = this.map;

        let now = new Date();

        let i = 0;

        let timer = setInterval(() => {
            let ct = new Date();

            // get passed time
            let timePassed = i === 0 ? 0 : ct - now;
            let time = new Date(now.getTime() + 60 * timePassed);

            context2.clearRect(0, 0, width, height);

            // display timer
            context2.font = "bold 14px sans-serif";
            context2.fillStyle = "#333";
            context2.textAlign = "center";
            context2.fillText(d3TimeFormat(time), width / 2, 10);

            // when to clear timer
            if (i >= len) {
                clearInterval(timer);
                this.setState({ isDrawing: false });
                const oHint = document.getElementsByClassName("hint")[0];
                oHint.innerHTML = "";
                return;
            }

            // for each satellite,对每一个卫星进行画图
            data.forEach(sat => {
                const { info, positions } = sat;  // info是卫星的名字
                this.drawSat(info, positions[i]); // i 表示当前的卫星的位置，及第几条数据（每60秒选一条数据）
            });

            i += 60;   // 加速了60倍
        }, 1000);
    };

    // 画卫星
    drawSat = (sat, pos) => {
        const { satlongitude, satlatitude } = pos;

        if (!satlongitude || !satlatitude) return;

        const { satname } = sat;
        const nameWithNumber = satname.match(/\d+/g).join("");

        const { projection, context2 } = this.map;
        const xy = projection([satlongitude, satlatitude]);

        context2.fillStyle = this.color(nameWithNumber);
        context2.beginPath();
        context2.arc(xy[0], xy[1], 4, 0, 2 * Math.PI);
        context2.fill();

        context2.font = "bold 11px sans-serif";
        context2.textAlign = "center";
        context2.fillText(nameWithNumber, xy[0], xy[1] + 14);
    };


    generateMap(land){
        // create a projection 投影仪
        const projection = geoKavrayskiy7()
            .scale(170)
            .translate([width / 2, height / 2])
            .precision(.1);

        const graticule = geoGraticule();

        // get map canvas
        const canvas = d3Select(this.refMap.current)
            .attr("width", width)
            .attr("height", height);

        // get track canvas
        const canvas2 = d3Select(this.refTrack.current)
            .attr("width", width)
            .attr("height", height);

        let context = canvas.node().getContext("2d");
        let context2 = canvas2.node().getContext("2d");

        // 画笔
        let path = geoPath().projection(projection).context(context);

        // data <-> map
        land.forEach(ele => {
            // 画国家
            context.fillStyle = '#B3DDEF';   //陆地颜色
            context.strokeStyle = '#000';  // 画笔=》 国家与国家的边界
            context.globalAlpha = 0.7;  // 调整清晰度
            context.beginPath();
            path(ele);
            context.fill();
            context.stroke();

            // 画经纬度数据
            context.strokeStyle = 'rgba(220, 220, 220, 0.1)';  // 经纬度线条的颜色+清晰度，等于是给画笔上了新颜色，覆盖了之前的旧颜色
            context.beginPath();
            path(graticule());
            context.lineWidth = 0.1;
            context.stroke();

            // 画整个地图的轮廓边界=》山下左右+陆地轮廓
            context.beginPath();
            context.lineWidth = 0.5;
            path(graticule.outline());
            context.stroke();
        });

        // 把map定义成map的属性，使得外部可访问
        this.map = {
            projection: projection,
            graticule: graticule,
            context: context,
            context2: context2
        };

    }

    render() {
        // const { isLoading } = this.state;
        return (
            <div className="map-box">
                {
                    this.state.isLoading ? (
                    <div className="spinner">
                        <Spin tip="Loading..." size="large" />
                    </div>
                ) : null
                }
                <canvas className="map" ref={this.refMap} />
                <canvas className="track" ref={this.refTrack} />
                <div className="hint" />
            </div>
        );
    }

}

export default WorldMap;
