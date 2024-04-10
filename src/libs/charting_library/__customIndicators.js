__customIndicators = [
    {
        name: "OldCSS",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "OldCSS@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "OldCSS",
            "description": "OldCSS",
            "shortDescription": "OldCSS",
            "is_hidden_study": false,
            "is_price_study": true,
            "isCustomIndicator": true,

            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 0,
                        "visible": true,
                        "linewidth": 2,

                        "plottype": 2,
                        "trackPrice": false,
                        "transparency": 40,
                        "color": "#FF0000"
                    }
                },
                "precision": 0,
                "inputs": {}
            },
            "styles": {
                "plot_0": {
                    "title": "OldCSS",
                    "histogramBase": 0,
                }
            },
            "inputs": [],
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context) + '#CSS';
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));

            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);
                var v = PineJS.Std.volume(this._context);

                var data = v.Kpi ? v : {
                    Kpi: {
                        Css: null
                    }
                };

                return [data.Kpi.Css];
            }
        }
    },
    {
        name: "OldOPS",
        metainfo: {
            _metainfoVersion: 27,
            isTVScript: false,
            isTVScriptStub: false,
            is_hidden_study: false,
            defaults: {
                styles: {
                    plot_0: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 2,
                        trackPrice: false,
                        transparency: 35,
                        visible: true,
                        color: "#0000FF"
                    },
                    plot_1: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 2,
                        trackPrice: false,
                        transparency: 35,
                        visible: true,
                        color: "#00FF00"
                    },
                    plot_2: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 2,
                        trackPrice: false,
                        transparency: 35,
                        visible: true,
                        color: "#00FF00"
                    }
                },
                precision: 0,
                filledAreasStyle: {
                    fill_0: {
                        color: "#008000",
                        transparency: 90,
                        visible: true
                    }
                },
                inputs: {
                    //in_0: 20,
                    //in_1: 2
                }
            },
            plots: [{
                id: "plot_0",
                type: "line"
            }, {
                id: "plot_1",
                type: "line"
            }, {
                id: "plot_2",
                type: "line"
            }],
            styles: {
                plot_0: {
                    title: "OPS",
                    histogramBase: 0,
                    joinPoints: false
                },
                plot_1: {
                    title: "MAX",
                    histogramBase: 0,
                    joinPoints: false
                },
                plot_2: {
                    title: "MIN",
                    histogramBase: 0,
                    joinPoints: false
                }
            },
            description: "OldOPS",
            shortDescription: "OldOPS",
            is_price_study: true,
            filledAreas: [{
                id: "fill_0",
                objAId: "plot_1",
                objBId: "plot_2",
                type: "plot_plot",
                title: "Plots Background"
            }],
            inputs: [],
            id: "OldOPS@tv-basicstudies-1",
            scriptIdPart: "",
            name: "OldOPS"
        },
        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context) + '#OPS';
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);
                var v = PineJS.Std.volume(this._context);

                var data = v.Kpi ? v : {
                    Kpi: {
                        Ops: null,
                        Max: null,
                        Min: null
                    }
                };
                return [data.Kpi.Ops, data.Kpi.Max, data.Kpi.Min];
            }
        }
    },
    //{
    //    name: "Balance",
    //    metainfo: {
    //        "_metainfoVersion": 40,
    //        "id": "Balance@tv-basicstudies-1",
    //        "scriptIdPart": "",
    //        "name": "Balance",
    //        "description": "Balance",
    //        "shortDescription": "Balance",
    //        "is_hidden_study": false,
    //        "is_price_study": true,
    //        "isCustomIndicator": true,

    //        "plots": [{
    //            "id": "plot_0",
    //            "type": "line"
    //        }],
    //        "defaults": {
    //            "styles": {
    //                "plot_0": {
    //                    "linestyle": 0,
    //                    "visible": true,
    //                    "linewidth": 2,

    //                    "plottype": 5, // bar
    //                    "trackPrice": false,
    //                    "transparency": 40,
    //                    "color": "#0000ff"
    //                }
    //            },
    //            "precision": 0,
    //            "inputs": {}
    //        },
    //        "styles": {
    //            "plot_0": {
    //                "title": "Balance",
    //                "histogramBase": 0,
    //            }
    //        },
    //        "inputs": [],
    //    },
    //    constructor: function () {

    //        this.init = function (context, inputCallback) {
    //            this._context = context;
    //            this._input = inputCallback;

    //            var symbol = PineJS.Std.ticker(this._context) + '#Balance';
    //            this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
    //        };

    //        this.main = function (context, inputCallback) {
    //            this._context = context;
    //            this._input = inputCallback;

    //            this._context.select_sym(1);
    //            var v = PineJS.Std.volume(this._context);
    //            var data = v.Balance ? v : {
    //                Balance: {
    //                    TotalIn: null,
    //                    TotalOut: null,
    //                    Balance: null
    //                }
    //            };
    //            //return [data.Balance.TotalIn, data.Balance.TotalOut, data.Balance.Balance];
    //            return [data.Balance.Balance];
    //        }
    //    }
    //},
    {
        name: "Forecast Old",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "ForecastOld@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "ForecastOld",
            "description": "ForecastOld",
            "shortDescription": "ForecastOld",

            "is_hidden_study": true,
            "is_price_study": true,
            "isCustomIndicator": true,

            "show_hide_button_in_legend": true,

            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 3,
                        "visible": true,

                        // Make the line normal
                        "linewidth": 1,

                        // Plot type is Line
                        "plottype": 2,

                        // Show price line
                        //"trackPrice": true,

                        "transparency": 40,

                        // Set color for the plot line
                        "color": "#999999"
                    }
                },

                // Precision is one digit, like 777.7
                "precision": 1,

                "inputs": {
                    id: null,
                    offset: 0,
                    float: 0,
                    bool: false
                }
            },
            "styles": {
                "plot_0": {
                    // Output name will be displayed in the Style window
                    "title": "Forecast value",
                    "histogramBase": 0,
                    "joinPoints": false,
                    "linestyle": 3
                }
            },
            "inputs": [
                {
                    id: "model",
                    name: "model",
                    type: "string",
                    defval: "n/a"
                },
                {
                    id: "ID",
                    name: "ID",
                    type: "integer",
                    defval: -1,
                    min: -1
                }
                //,
                //{
                //    id: "offset",
                //    name: "Offset",
                //    defval: 0,
                //    type: "integer",
                //    min: -1e12,
                //    max: 1e12
                //},
                //{
                //    id: "float",
                //    name: "Float",
                //    defval: 0,
                //    type: "float"
                //},
                //{
                //    id: "bool",
                //    name: "Boolean",
                //    defval: !1,
                //    type: "bool"
                //}
            ],
        },

        constructor: function () {
            /**
             * This function is called by the chart library to initialize an instance of this custom indicator.
             */
            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                /// change symbol and reset counters
                var symbol = PineJS.Std.ticker(this._context) + "#FORECAST";
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
                this._totalCount = 0;
            };

            /**
             * This function is called by the chart library on each data point of time series.
             */
            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;
                this._context.select_sym(1);    // !Important: custom symbol is at index 1

                var v1 = null;
                var offset = 0;

                var v = PineJS.Std.volume(this._context);
                if (v.Forecasts && v.Forecasts.list[this._input(1)]) {  // this._input(1) is the forecast ID
                    v1 = v.Forecasts.list[this._input(1)].Predict;
                }

                return [{ value: v1, offset: offset }];
            }
        }
    },

    {
        name: "Forecast",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "Forecast@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "Forecast",
            "description": "Forecast",
            "shortDescription": "Forecast",
            "is_hidden_study": true,
            "is_price_study": true,
            "isCustomIndicator": true,
            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 0,
                        "visible": true,
                        "linewidth": 2,
                        "plottype": 2,
                        "trackPrice": false,
                        "transparency": 40,
                        "color": "#997700"
                    }
                },
                "precision": 0,
                "inputs": {}
            },
            "styles": {
                "plot_0": {
                    "title": "Forecast",
                    "histogramBase": 0,
                }
            },
            "inputs": []
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context);
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);
                
                data = window.parent.forecast_data_timeseries;
                if (data[this._context.symbol.time]) {
                    return [data[this._context.symbol.time].value];
                }

                var lastValue = undefined;
                for (var i in data) {
                    if (i >= this._context.symbol.time) {
                        break;
                    }

                    lastValue = data[i].value;
                }

                return [lastValue];
            }
        }
    },
    {
        name: "Disposition",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "Disposition@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "Disposition",
            "description": "Disposition",
            "shortDescription": "Disposition",
            "is_hidden_study": true,
            "is_price_study": true,
            "isCustomIndicator": true,
            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 0,
                        "visible": true,
                        "linewidth": 2,
                        "plottype": 2,
                        "trackPrice": false,
                        "transparency": 40,
                        "color": "#990000"
                    }
                },
                "precision": 0,
                "inputs": {}
            },
            "styles": {
                "plot_0": {
                    "title": "Disposition",
                    "histogramBase": 0,
                }
            },
            "inputs": []
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context);
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);

                data = window.parent.dispo_data_timeseries;
                if (data[this._context.symbol.time]) {
                    return [data[this._context.symbol.time].value];
                }

                var lastValue = undefined;
                for (var i in data) {
                    if (i >= this._context.symbol.time) {
                        break;
                    }

                    lastValue = data[i].value;
                }

                return [lastValue];
            }
        }
    },
    {
        name: "Plan",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "Plan@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "Plan",
            "description": "Plan",
            "shortDescription": "Plan",
            "is_hidden_study": true,
            "is_price_study": true,
            "isCustomIndicator": true,
            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 0,
                        "visible": true,
                        "linewidth": 2,
                        "plottype": 2,
                        "trackPrice": false,
                        "transparency": 40,
                        "color": "#006699"
                    }
                },
                "precision": 0,
                "inputs": {}
            },
            "styles": {
                "styleType": 0,
                "plot_0": {
                    "title": "Forecast + Disposition",
                    "histogramBase": 0,
                }
            },
            "inputs": []
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context);
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);

                data = window.parent.combine_data_timeseries;
                if (data[this._context.symbol.time]) {
                    return [data[this._context.symbol.time].value];
                }

                var lastValue = undefined;
                for (var i in data) {
                    if (i >= this._context.symbol.time) {
                        break;
                    }

                    lastValue = data[i].value;
                }

                return [lastValue];
            }
        }
    },
    {
        name: "Boundary",
        metainfo: {
            _metainfoVersion: 27,
            isTVScript: false,
            isTVScriptStub: false,
            is_hidden_study: false,
            defaults: {
                styles: {
                    plot_0: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 2,
                        trackPrice: false,
                        transparency: 35,
                        visible: true,
                        color: "#00FF00"
                    },
                    plot_1: {
                        linestyle: 0,
                        linewidth: 1,
                        plottype: 2,
                        trackPrice: false,
                        transparency: 35,
                        visible: true,
                        color: "#00FF00"
                    }
                },
                precision: 0,
                filledAreasStyle: {
                    fill_0: {
                        color: "#008000",
                        transparency: 80,
                        visible: true
                    }
                },
                inputs: {
                    //in_0: 20,
                    //in_1: 2
                }
            },
            plots: [{
                id: "plot_0",
                type: "line"
            }, {
                id: "plot_1",
                type: "line"
            }],
            styles: {
                plot_0: {
                    title: "MIN",
                    histogramBase: 0,
                    joinPoints: false
                },
                plot_1: {
                    title: "MAX",
                    histogramBase: 0,
                    joinPoints: false
                }
            },
            description: "Boundary",
            shortDescription: "Boundary",
            is_price_study: true,
            filledAreas: [{
                id: "fill_0",
                objAId: "plot_0",
                objBId: "plot_1",
                type: "plot_plot",
                title: "Plots Background"
            }],
            inputs: [],
            id: "Boundary@tv-basicstudies-1",
            scriptIdPart: "",
            name: "Boundary"
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context);
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);

                data = window.parent.boundary_data_timeseries;
                var boundary = {
                    Min: null,
                    Max: null
                };
                if (data[this._context.symbol.time]) {
                    boundary = {
                        Min: data[this._context.symbol.time].Min,
                        Max: data[this._context.symbol.time].Max
                    }
                } else {
                    for (var i in data) {
                        if (i >= this._context.symbol.time) {
                            break;
                        }

                        boundary = {
                            Min: data[i].Min,
                            Max: data[i].Max
                        };
                    }
                }
                //console.log(boundary.Min, boundary.Max);
                return [boundary.Min, boundary.Max];
            }
        }
    },
    {
        name: "CSS",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "CSS@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "CSS",
            "description": "CSS",
            "shortDescription": "CSS",
            "is_hidden_study": false,
            "is_price_study": true,
            "isCustomIndicator": true,

            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 0,
                        "visible": true,
                        "linewidth": 2,

                        "plottype": 2,
                        "trackPrice": false,
                        "transparency": 40,
                        "color": "#FF0000"
                    }
                },
                "precision": 0,
                "inputs": {}
            },
            "styles": {
                "plot_0": {
                    "title": "CSS",
                    "histogramBase": 0,
                }
            },
            "inputs": [],
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context);
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);
                data = window.parent.boundary_data_timeseries;
                var Css = null;
                if (data[this._context.symbol.time]) {
                    Css = data[this._context.symbol.time].ActualCss;
                } else {
                    for (var i in data) {
                        if (i >= this._context.symbol.time) {
                            break;
                        }

                        Css = data[i].ActualCss;
                    }
                }
                //console.log(Css);
                return [Css];
            }
        }
    },
    {
        name: "OPS",
        metainfo: {
            "_metainfoVersion": 40,
            "id": "OPS@tv-basicstudies-1",
            "scriptIdPart": "",
            "name": "OPS",
            "description": "OPS",
            "shortDescription": "OPS",
            "is_hidden_study": false,
            "is_price_study": true,
            "isCustomIndicator": true,

            "plots": [{
                "id": "plot_0",
                "type": "line"
            }],
            "defaults": {
                "styles": {
                    "plot_0": {
                        "linestyle": 0,
                        "visible": true,
                        "linewidth": 2,

                        "plottype": 2,
                        "trackPrice": false,
                        "transparency": 40,
                        "color": "#0000FF"
                    }
                },
                "precision": 0,
                "inputs": {}
            },
            "styles": {
                "plot_0": {
                    "title": "OPS",
                    "histogramBase": 0,
                }
            },
            "inputs": [],
        },

        constructor: function () {

            this.init = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                var symbol = PineJS.Std.ticker(this._context);
                this._context.new_sym(symbol, PineJS.Std.period(this._context), PineJS.Std.period(this._context));
            };

            this.main = function (context, inputCallback) {
                this._context = context;
                this._input = inputCallback;

                this._context.select_sym(1);
                data = window.parent.boundary_data_timeseries;
                var Ops = null;
                if (data[this._context.symbol.time]) {
                    Ops = data[this._context.symbol.time].ActualOps;
                } else {
                    for (var i in data) {
                        if (i >= this._context.symbol.time) {
                            break;
                        }

                        Ops = data[i].ActualOps;
                    }
                }

                return [Ops];
            }
        }
    }
];
