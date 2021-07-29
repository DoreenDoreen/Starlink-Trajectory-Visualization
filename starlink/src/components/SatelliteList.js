import React, {Component} from 'react';
import { Button, Spin, List, Avatar, Checkbox } from 'antd';
import satellite from "../assets/images/satellite.svg";

class SatelliteList extends Component {
    state = {
        selected: []
    }

    constructor(){
        super();
        this.state = {
            selected: [],
            isLoad: false
        };
    }


    onChange = e => {
        // step1: get dataInfo and checked
        const { dataInfo, checked } = e.target;
        // step2: add remove selected satellite to / from selected array
        const { selected } = this.state;
        const list = this.addOrRemove(dataInfo, checked, selected);
        //step3: setState
        this.setState({ selected: list })
    }

    addOrRemove = (item, status, list) => {
        // case1: chek is true
        //      -> sat not in the list => add it
        //      -> sat is in the list => do nothing

        // case2: check is false
        //      ->
        //      ->
        const found = list.some( entry => entry.satid === item.satid);
        if(status && !found){
            list.push(item)
        }

        if(!status && found){
            list = list.filter( entry => {
                return entry.satid !== item.satid;
            });
        }
        return list;
    }

    render() {
        const { satInfo, isLoad } = this.props;
        const { selected } = this.state;
        const satList = satInfo ? satInfo.above : [];

        return (
            <div className="sat-list-box">
                {/*<div className="btn-container">*/}
                    <Button className="sat-list-btn" size="large" type="primary"
                            onClick={this.showMap}
                            disabled={selected.length === 0} >
                        Track on the map
                    </Button>
                {/*</div>*/}
                <hr/>
                {
                    isLoad
                    ?
                    <div className='spin-box' >
                         <Spin tip="Loading..." size="large" />
                    </div>
                    :
                        <List
                            className="sat-list"
                            itemLayout="horizontal"
                            size="small"
                            dataSource={satList}
                            renderItem={item => (

                                <List.Item
                                    actions={[<Checkbox dataInfo={item} onChange={this.onChange}/>]}
                                >
                                    <List.Item.Meta
                                        avatar={<Avatar size={50} src={satellite} alt="satellite" />}
                                        title={<p>{item.satname}</p>}
                                        description={`Launch Date: ${item.launchDate}`}
                                    />

                                </List.Item>
                            )}

                        />
                }
            </div>
        );
    }

    showMap = () => {
        const { selected } = this.state;
        this.props.onShowMap(selected);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if(prevProps.satInfo !== this.props.satInfo) {
            this.setState({selected: []})
        }
    }


}

export default SatelliteList;
