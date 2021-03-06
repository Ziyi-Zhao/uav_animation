class syrMap {

    constructor(mapID, uavdata, startArea, endArea) {
        this.googlemap = new google.maps.Map(document.getElementById(mapID), {
            zoom: 13,
            center: {lat: 43.0481221, lng: -76.14742439999999}
        });
        //for animation
        this.timeoutArr = [];
        //pointing to json
        this.uavData = uavdata;
        //start area json
        this.startArea = startArea;
        //end area json
        this.endArea = endArea;
        //updated time for query
        this.updatedCurrTime = 0;
        //flags
        this.showTrackFlag = document.getElementById('uavTrackChkBox').checked;
        this.showUAVIDFlag = document.getElementById('uavIDChkBox').checked;
        this.timeInterval = 0;
        this.hideUAVFlag = document.getElementById('uavHideChkBox').checked;;
        this.hideUAVTrackFlag = document.getElementById('uavHideChkBox').checked;;
        this.updateCurrtimeFlag = false;
        //store all the flying uav
        this.uavMap = new Map();
        //show area
        this.showStartArea();
        this.showEndArea();
    }


    showStartArea() {
        for (let item in this.startArea) {
            let rectangle = new google.maps.Rectangle({
                strokeColor: '#FF0000',
                strokeOpacity: 0.05,
                strokeWeight: 2,
                fillColor: '#FF0000',
                fillOpacity: 0.35,
                map: this.googlemap,
                bounds: {
                    north: Number(this.startArea[item].bottom_right_y),
                    south: Number(this.startArea[item].top_left_y),
                    east: Number(this.startArea[item].bottom_right_x),
                    west: Number(this.startArea[item].top_left_x)
                }
            });
        }
    }


    showEndArea() {
        for (let item in this.endArea) {
            let rectangle = new google.maps.Rectangle({
                strokeColor: '#0000FF',
                strokeOpacity: 0.05,
                strokeWeight: 2,
                fillColor: '#0000FF',
                fillOpacity: 0.35,
                map: this.googlemap,
                bounds: {
                    north: Number(this.endArea[item].bottom_right_y),
                    south: Number(this.endArea[item].top_left_y),
                    east: Number(this.endArea[item].bottom_right_x),
                    west: Number(this.endArea[item].top_left_x)
                }
            });
        }
    }



    checkTimeSeg() {
        let currTimeStep = this.uavData[0].TimeStep;
        let tempIndex = 0;
        while (tempIndex < this.uavData.length) {
            if (this.uavData[tempIndex].TimeStep !== currTimeStep) {
                break;
            }
            tempIndex += 1;
        }
        return tempIndex;
    }


    fly() {
        if (this.updateCurrtimeFlag) {
            this.updateCurrtime();
        }

        let intervalId = setInterval(() => {
            //exit
            if (this.uavData.length == 0) {
                console.log("done,", this.uavData.length);
                clearInterval(intervalId);
                return;
            }
            //console.log("length ", this.uavData.length);
            //console.log("first ele", this.uavData[0]);
            let endIndex = this.checkTimeSeg();
            let currIndex = 0;
            let currID = 0;
            let currUAV;

            document.getElementById('curtime').value= this.uavData[currIndex].TimeStep;
            document.getElementById('curUAVnum').value = this.uavMap.size;
            while (currIndex < endIndex) {
                currID = this.uavData[currIndex].ID;
                //console.log("curr Index ", currIndex);
                //console.log("curr uav ID", currID);
                //new UAV
                if (!this.uavMap.has(currID)) {
                    //new icon
                    let labelid = null;
                    let image;
                    //if show uav id
                    if (this.showUAVIDFlag) {
                        labelid = this.uavData[currIndex].ID;
                        image = {path: google.maps.SymbolPath.CIRCLE, scale: 0};
                    } else {
                        image = '/images/uav.png';
                        labelid = null;
                    }
                    // make marker
                    let marker = new google.maps.Marker({
                        position: {
                            lat: Number(this.uavData[currIndex].Latitude),
                            lng: Number(this.uavData[currIndex].Longitude)
                        },
                        map: this.googlemap,
                        icon: image,
                        label: labelid
                    });
                    //new obj insert to uavMap
                    let newUAV = new UAV(this.uavData[currIndex], marker);
                    this.uavMap.set(currID, newUAV);
                    //console.log("new UAV ID ", currID);
                } else {
                    // uav exists
                    currUAV = this.uavMap.get(currID);
                    //console.log("exist uav",currUAV);
                    //uav lands
                    if (this.uavData[currIndex].finished === '-1') {
                        //remove icon
                        if (this.hideUAVFlag) {
                            currUAV.mapmarker.setMap(null);
                        }
                        if (this.hideUAVTrackFlag) {
                            for (let item in currUAV.prePath) {
                                currUAV.prePath[item].setMap(null);
                            }
                        }
                        //delete element in map
                        this.uavMap.delete(currID);
                    }
                    //uav moving
                    else {
                        if (this.showTrackFlag) {
                            let lineSymbol = {
                                path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
                            };
                            let flightPath = new google.maps.Polyline({
                                path: [{lat: currUAV.lat, lng: currUAV.long},
                                    {
                                        lat: Number(this.uavData[currIndex].Latitude),
                                        lng: Number(this.uavData[currIndex].Longitude)
                                    }],
                                icons: [{
                                    icon: lineSymbol,
                                    offset: '100%'
                                }],
                                geodesic: true,
                                strokeColor: '#42b0f4',
                                strokeOpacity: 1.0,
                                strokeWeight: 2
                            });
                            currUAV.prePath.push(flightPath);
                            flightPath.setMap(this.googlemap);
                        }
                        currUAV.mapmarker.setPosition({
                            lat: Number(this.uavData[currIndex].Latitude),
                            lng: Number(this.uavData[currIndex].Longitude)
                        });
                        //update uav
                        currUAV.lat = Number(this.uavData[currIndex].Latitude);
                        currUAV.long = Number(this.uavData[currIndex].Longitude);
                        this.uavMap.set(currID, currUAV);
                    }
                }
                currIndex += 1;
            }
            //move uadData loading window
            this.uavData.splice(0, endIndex);
             }, this.timeInterval);
        this.timeoutArr.push(intervalId);
    }

    pause() {
        for (let item in this.timeoutArr) {
            clearTimeout(this.timeoutArr[item]);
        }
    }

    resume() {
        this.fly();
    }

    setTimeInterval() {
        this.timeInterval = document.getElementById('timeinterval').value;
    }

    setShowTrack() {
        this.showTrackFlag = document.getElementById('uavTrackChkBox').checked;
    }

    setShowUAVID() {
        this.showUAVIDFlag = document.getElementById('uavIDChkBox').checked;
    }

    setHideUAVTrack() {
        this.hideUAVFlag = document.getElementById('uavHideChkBox').checked;
        this.hideUAVTrackFlag = document.getElementById('uavHideChkBox').checked;
    }
    getCurrTime(currtime) {
        this.updateCurrtimeFlag = true;
        this.updatedCurrTime = Number(document.getElementById('setCurtime').value);
    }

    updateCurrtime() {
        let endIndex = this.uavData.length;
        if (Number(this.uavData[endIndex-1].TimeStep) < this.updatedCurrTime) {
            alert("input time doesn't exist in data");
        }
        let startIndex = 0;
        let midIndex;
        let midTimeStep = 0;
        let resultIndex = 0;
        //binary search
        while (startIndex + 1 < endIndex) {
            midIndex =parseInt( startIndex + (endIndex - startIndex) / 2);
            midTimeStep = Number(this.uavData[midIndex].TimeStep);
            if (midTimeStep < this.updatedCurrTime) {
                startIndex = midIndex;
            } else {
                endIndex = midIndex;
            }
        }
        if (Number(this.uavData[startIndex].TimeStep) === this.updatedCurrTime) {
            resultIndex = startIndex;
        }
        if (Number(this.uavData[endIndex].TimeStep) === this.updatedCurrTime) {
            resultIndex = endIndex;
        }
        //move to that timestep
        this.uavData.splice(0, resultIndex);
    }

}