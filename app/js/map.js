/*!
 * SVG Map
 * @version v1.1.0
 * @author  Rocky(rockyuse@163.com)
 * @date    2015-08-28
 *
 * (c) 2012-2015 Rocky, https://github.com/rockyuse
 * This is licensed under the GNU LGPL, version 2.1 or later.
 * For details, see: http://creativecommons.org/licenses/LGPL/2.1/
 */
;
! function(window, $, undefined) {
    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(searchElement, fromIndex) {
            var k;
            if (this == null) {
                throw new TypeError('"this" is null or not defined');
            }
            var o = Object(this);
            var len = o.length >>> 0;

            if (len === 0) {
                return -1;
            }
            var n = +fromIndex || 0;

            if (Math.abs(n) === Infinity) {
                n = 0;
            }

            if (n >= len) {
                return -1;
            }

            k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

            while (k < len) {
                if (k in o && o[k] === searchElement) {
                    return k;
                }
                k++;
            }
            return -1;
        };
    };

    Array.prototype.remove = function(val) {
        var index = this.indexOf(val);
        if (index > -1) {
            this.splice(index, 1);
        }
    };

    var SVGMap = (function() {
        function SVGMap(dom, options) {
            this.externalData = {};
            this.dom = dom;
            this.setOptions(options);
            this.render();
        }

        SVGMap.prototype.options = {
            mapName: 'china',
            mapWidth: 500,
            mapHeight: 400,
            stateColorList: ['#2770B5', '#429DD4', '#5AABDA', '#1C8DFF', '#70B3DD', '#C6E1F4', '#EDF2F6'],

            stateDataAttr: ['stateInitColor', 'stateHoverColor', 'stateSelectedColor', 'baifenbi'],
            stateDataType: 'json',
            stateSettingsXmlPath: '',

            stateData: {},

            strokeWidth: 1,
            strokeColor: '#F9FCFE',
            stateCursor: 'default',

            stateInitColor: '#AAD5FF', //fill_color
            stateHoverColor: '#feb41c',
            stateSelectedColor: '#EC971F',
            stateDisabledColor: '#eeeeee',

            linkOut: false,
            linkOutTarget: 'new',

            showTipInit: true,
            showTip: true,
            mapTipWidth: 100,
            //mapTipHeight: 50,
            mapTipX: 0,
            mapTipY: -10,
            mapTipHtml: function(stateData, obj) {
                return obj.name;
            },
            showCity: false,
            showName: false,
            showNameAttr: {
                'fill': '#333',
                'font-family': 'Microsoft yahei',
                'font-size': 60,
                'font-weight': 'normal',
                'cursor': 'default'

                // 'href': 'http://baidu.com',
                // 'target': 'new'
            },
            showNameHoverAttr: null,

            showCapital: false,
            panleMask: null,
            hoverCallback: function(stateData, obj) {},

            clickColorChange: false,
            clickCallback: function(stateData, obj) {},
            unClickCallback: function(stateData, obj) {},

            hoverRegion: '',
            clickedRegion: [],
            scaleRate: '',

            external: false,

            showOtherText: false, // 显示文本信息
            showOtherTextAttr: {},
            showOtherTextLink: false,
            Special_diabled: ['nanhaizhudao0'],
            Special_click: ['nanhaizhudao0', 'nanhaizhudao', 'diaoyudao'],
            customModule: function(paper, options) {}
        };

        SVGMap.prototype.setOptions = function(options) {
            this.options = $.extend({}, this.options, options || null);
            return this;
        };

        // ie Pollfill
        SVGMap.prototype.scaleRaphael = function(container, viewBox) {
            var that_dom = this.dom;
            var width = viewBox[2];
            var height = viewBox[3];

            var wrapper = document.getElementById(container);
            if (!wrapper.style.position) wrapper.style.position = "relative";
            $(wrapper).css({
                'width': width + "px",
                'height': height + "px",
                'overflow': 'hidden'
            });
            var nestedWrapper;
            if (Raphael.type == "VML") {
                wrapper.innerHTML = "<rvml:group style='position : absolute; top: 0px; left: 0px' coordsize='1000,1000' class='rvml' id='vmlgroup_" + container + "'><\/rvml:group>";
                nestedWrapper = document.getElementById("vmlgroup_" + container);
            } else {
                wrapper.innerHTML = '<div class="svggroup"></div>';
                nestedWrapper = wrapper.getElementsByClassName("svggroup")[0];
            }

            var paper = new Raphael(nestedWrapper, width, height);
            var vmlDiv;
            if (Raphael.type == "SVG") {
                paper.canvas.setAttribute("viewBox", viewBox[0] + ' ' + viewBox[1] + ' ' + width + ' ' + height);
            } else {
                vmlDiv = wrapper.getElementsByTagName("div")[0];
            }

            paper.changeSize = function(w, h, center, clipping) {
                var ratioW = w / width;
                var ratioH = h / height;
                var scale = ratioW < ratioH ? ratioW : ratioH;

                var newHeight = parseInt(height * scale);
                var newWidth = parseInt(width * scale);
                if (Raphael.type == "VML") {
                    var txt = document.getElementsByTagName("textpath");
                    for (var i in txt) {
                        var curr = txt[i];
                        if (curr.style) {
                            if (!curr._fontSize) {
                                var mod = curr.style.font.split("px");
                                curr._fontSize = parseInt(mod[0]);
                                curr._font = mod[1];
                            }
                            curr.style.font = curr._fontSize * scale + "px" + curr._font;
                        }
                    }
                    var newSize;
                    if (newWidth < newHeight) {
                        newSize = newWidth * 1000 / width;
                    } else {
                        newSize = newHeight * 1000 / height;
                    }
                    newSize = parseInt(newSize) + 2;
                    nestedWrapper.style.width = newSize + "px";
                    nestedWrapper.style.height = newSize + "px";
                    if (!clipping) {
                        var _rate = newWidth / width;
                        var _paddingTop = parseInt(that_dom.css('padding-top'));
                        nestedWrapper.style.left = -_rate * viewBox[0] + parseInt((w - newWidth) / 2) + "px";
                        nestedWrapper.style.top = -_rate * viewBox[1] + parseInt((h - newHeight) / 2) + _paddingTop + "px";
                    }
                    vmlDiv.style.overflow = "visible";
                }
                if (!clipping) {
                    newWidth = w;
                    newHeight = h;
                }
                $(wrapper).css({
                    'width': newWidth + "px",
                    'height': newHeight + "px"
                });
                paper.setSize(newWidth, newHeight);

                if (center) {
                    wrapper.style.position = "absolute";
                    wrapper.style.left = parseInt((w - newWidth) / 2) + "px";
                    wrapper.style.top = parseInt((h - newHeight) / 2) + "px";
                }
                return {
                    width: newWidth,
                    height: newHeight
                }
            };

            paper.w = width;
            paper.h = height;
            return paper;
        };

        SVGMap.prototype.render = function() {
            var self = this;
            var opt = this.options,
                $dom = this.dom,
                mapName = opt.mapName,
                mapConfig = eval(mapName + 'MapConfig');

            var stateData = {};

            if (opt.stateDataType == 'xml') {
                var mapSettings = opt.stateSettingsXmlPath;
                $.ajax({
                    type: 'GET',
                    url: mapSettings,
                    async: false,
                    dataType: $.browser.msie ? 'text' : 'xml',
                    success: function(data) {
                        var xml;
                        if ($.browser.msie) {
                            xml = new ActiveXObject('Microsoft.XMLDOM');
                            xml.async = false;
                            xml.loadXML(data);
                        } else {
                            xml = data;
                        }
                        var $xml = $(xml);
                        $xml.find('stateData').each(function(i) {
                            var $node = $(this),
                                stateName = $node.attr('stateName');

                            stateData[stateName] = {};
                            for (var i = 0, len = opt.stateDataAttr.length; i < len; i++) {
                                stateData[stateName][opt.stateDataAttr[i]] = $node.attr(opt.stateDataAttr[i]);
                            }
                        });
                    }
                });
            } else {
                stateData = opt.stateData;
            };

            // 坐标点的xy坐标
            var offsetXY = function(e) {
                var mouseX, mouseY, tipWidth = $('#MapTip').outerWidth(),
                    tipHeight = $('#MapTip').outerHeight();
                if (e && e.pageX) {
                    mouseX = e.pageX;
                    mouseY = e.pageY;
                } else {
                    mouseX = event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
                    mouseY = event.clientY + document.body.scrollTop + document.documentElement.scrollTop;
                }
                mouseX = mouseX - tipWidth / 2 + opt.mapTipX < 0 ? 0 : mouseX - tipWidth / 2 + opt.mapTipX;
                mouseY = mouseY - tipHeight + opt.mapTipY < 0 ? mouseY - opt.mapTipY : mouseY - tipHeight + opt.mapTipY;
                return [mouseX, mouseY];
            };

            var current;

            var r = this.scaleRaphael($dom.attr('id'), mapConfig.viewBox),
                attributes = {
                    'fill': opt.stateInitColor,
                    'cursor': opt.stateCursor,
                    'stroke': opt.strokeColor,
                    'stroke-width': mapConfig.base.strokeWidth == undefined ? opt.strokeWidth : mapConfig.base.strokeWidth,
                    'stroke-linejoin': 'round'
                };

            // hover
            function sharpHover(e, obj) {
                if (opt.hoverRegion == obj.id) {
                    opt.timeTimer = 1;
                    clearTimeout(obj.timer);
                    return;
                }
                if (!opt.external || typeof self.externalData[obj.id].eventHoverLock == 'undefined' || self.externalData[obj.id].eventHoverLock == false) {
                    if (opt.clickedRegion.indexOf(obj.id) == -1 && opt.Special_diabled.indexOf(obj.id) == -1) {
                        obj.animate({
                            fill: stateColor[obj.id].hoverColor
                        }, 150);
                    }
                }

                if (opt.showTip && opt.Special_diabled.indexOf(obj.id) == -1) {
                    opt.timeTimer = 1;
                    if ($('#MapTip').length == 0) {
                        $(document.body).append('<div id="MapTip" class="mapTip"><div class="con"></div></div');
                    }
                    $('#MapTip .con').html(opt.mapTipHtml(stateData, obj));
                    var _offsetXY = offsetXY(e);

                    $('#MapTip').css({
                        width: opt.mapTipWidth || 'auto',
                        height: opt.mapTipHeight || 'auto',
                        left: _offsetXY[0],
                        top: _offsetXY[1]
                    }).show();
                }

                opt.hoverRegion = obj.id;
                opt.hoverCallback(stateData, obj);
            }

            // out
            function sharpOut(e, obj) {
                opt.timeTimer = 0;
                opt.hoverRegion = '';

                obj.timer = setTimeout(function() {
                    if (opt.hoverRegion == obj.id) {
                        return;
                    }

                    if (!opt.external || typeof self.externalData[obj.id].eventHoverLock == 'undefined' || self.externalData[obj.id].eventHoverLock == false) {
                        if (obj.name == '南海诸岛' && opt.Special_diabled.indexOf(obj.id) == -1) {
                            obj.animate({
                                fill: '#d9e9fa'
                            }, 100);
                        } else {
                            if (opt.clickedRegion.indexOf(obj.id) == -1) {
                                obj.animate({
                                    fill: stateColor[obj.id].initColor
                                }, 100);
                            }
                        }
                    }
                    if (opt.showTip && opt.timeTimer != 1) {
                        $('#MapTip').remove();
                    }
                }, 100);
            }

            // click
            function sharpClick(e, obj) {
                if (opt.showCity != false && opt.Special_click.indexOf(obj.id) == -1) {
                    opt.showCity(obj.id);
                    return;
                }
                if (opt.clickColorChange == false) {
                    return;
                }
                if (!opt.external || typeof self.externalData[obj.id].eventClickLock == 'undefined' || self.externalData[obj.id].eventClickLock == false) {
                    if (opt.clickedRegion.indexOf(obj.id) == -1) {
                        opt.clickedRegion.push(obj.id);
                        obj.animate({
                            fill: stateColor[obj.id].selectedColor
                        }, 150);
                        opt.clickCallback(stateData, obj);
                    } else {
                        opt.clickedRegion.remove(obj.id);

                        if (!opt.external || typeof self.externalData[obj.id].eventHoverLock == 'undefined' || self.externalData[obj.id].eventHoverLock == false) {
                            obj.animate({
                                fill: stateColor[obj.id].hoverColor
                            }, 150);
                        } else {
                            obj.animate({
                                fill: stateColor[obj.id].initColor
                            }, 150);
                        }
                        opt.unClickCallback(stateData, obj);
                    }
                }
            }

            var stateColor = {};
            var _coordinate;

            // 还原图片缩放比例
            var _scale_w = opt.mapWidth / r.w,
                _scale_h = opt.mapHeight / r.h;
            opt.scaleRate = Math.min(_scale_w, _scale_h) < 0 ? Math.min(_scale_w, _scale_h) : 1 / Math.min(_scale_w, _scale_h);
            for (var state in mapConfig.shapes) {
                var thisStateData = stateData[state],
                    initColor = (thisStateData && opt.stateColorList[thisStateData.stateInitColor] || opt.stateInitColor),
                    hoverColor = (thisStateData && thisStateData.stateHoverColor || opt.stateHoverColor),
                    selectedColor = (thisStateData && thisStateData.stateSelectedColor || opt.stateSelectedColor),
                    disabledColor = (thisStateData && thisStateData.stateDisabledColor || opt.stateDisabledColor);

                stateColor[state] = {};
                _coordinate = mapConfig.coordinate[state];

                stateColor[state].initColor = initColor;
                stateColor[state].hoverColor = hoverColor;
                stateColor[state].selectedColor = selectedColor;

                var obj = r.path(mapConfig['shapes'][state]).toBack();
                // obj
                obj.id = state;
                obj.name = mapConfig['names'][state];
                obj.timer = '';
                obj.attr(attributes);

                if (opt.external) {
                    this.externalData[obj.id] = obj;
                }

                if (thisStateData && thisStateData.diabled) {
                    obj.attr({
                        fill: disabledColor,
                        cursor: 'default'
                    });
                } else {
                    if (obj.name == '南海诸岛' && opt.Special_diabled.indexOf(obj.id) === -1) {
                        obj.attr({
                            fill: '#d9e9fa'
                        });
                    } else {
                        obj.attr({
                            fill: initColor
                        });
                    }

                    // 划过改变颜色
                    (function(obj) {
                        obj.hover(function(e) {
                            sharpHover(e, this);
                        }, function(e) {
                            if (opt.external && typeof self.externalData[obj.id].eventHoverLock != 'undefined' && self.externalData[obj.id].eventHoverLock == true) {
                                return;
                            }
                            sharpOut(e, this);
                        }).click(function(e) {
                            if (opt.external && typeof self.externalData[obj.id].eventClickLock != 'undefined' && self.externalData[obj.id].eventClickLock == true) {
                                return;
                            }
                            sharpClick(e, this);
                        });
                    })(obj);

                }
                // 给需要添加链接的添加链接
                var _isneed_href = (function() {
                    return opt.linkOut && typeof stateData[obj.id] != 'undefined' && typeof stateData[obj.id]['otherText']['link'] != 'undefined'
                })();
                if (_isneed_href) {
                    obj.attr({ 'href': stateData[obj.id]['otherText']['link'], 'target': stateData[obj.id]['otherText']['linkTarget'], 'cursor': 'pointer' })
                }
                // 文字坐标点
                if (opt.showName && opt.Special_diabled.indexOf(obj.id) === -1) {
                    opt.showNameAttr['font-size'] = mapConfig.base.fontSize;
                    var _provinceName = r.text(_coordinate[0], _coordinate[1], obj.name).attr(opt.showNameAttr);
                    if (_isneed_href) {
                        _provinceName.attr({ 'href': stateData[obj.id]['otherText']['link'], 'target': stateData[obj.id]['otherText']['linkTarget'], 'cursor': 'pointer' });
                    }
                    (function(obj, _provinceName) {
                        _provinceName.hover(function(e) {
                            sharpHover(e, obj);
                            if (opt.showNameHoverAttr !== null) {
                                this.attr({
                                    'fill': opt.showNameHoverColor
                                })
                            }
                        }, function(e) {
                            sharpOut(e, obj);
                            if (opt.showNameHoverAttr !== null) {
                                this.attr({
                                    'fill': opt.showNameAttr['fill']
                                })
                            }
                        }).click(function(e) {
                            sharpClick(e, obj);
                        });
                        if (opt.showNameHoverAttr !== null) {
                            obj.hover(function() {
                                _provinceName.attr({
                                    'fill': opt.showNameHoverColor
                                })
                            }, function() {
                                _provinceName.attr({
                                    'fill': opt.showNameAttr['fill']
                                })
                            })
                        }
                    })(obj, _provinceName);
                }

                // 省会城市坐标点
                if (opt.showCapital && opt.Special_diabled.indexOf(obj.id) === -1) {
                    var _capitalPoint = r.circle(_coordinate[2], _coordinate[3], mapConfig.base.point).attr({
                        'fill': '#d9534f',
                        // 'stroke': opt.strokeColor,
                        'stroke-width': 0
                    });
                    (function(obj, _provinceName) {
                        _capitalPoint.hover(function(e) {
                            sharpHover(e, obj);
                        }, function(e) {
                            sharpOut(e, obj);
                        }).click(function(e) {
                            sharpClick(e, obj);
                        });
                        if (_provinceName && opt.showNameHoverAttr !== null) {
                            obj.hover(function() {
                                _provinceName.attr({
                                    'fill': opt.showNameHoverColor
                                })
                            }, function() {
                                _provinceName.attr({
                                    'fill': opt.showNameAttr['fill']
                                })
                            })
                        }
                    })(obj, _provinceName);
                }

                // 其他信息（图标）
                if (opt.showOtherText && typeof stateData[obj.id] != 'undefined' && typeof stateData[obj.id].otherText != 'undefined' && opt.Special_diabled.indexOf(obj.id) === -1) {
                    var _otherTextInfo = stateData[obj.id].otherText;

                    var _otherText = r.image(_otherTextInfo.info, _coordinate[0] - 50 * opt.scaleRate, _coordinate[1] - 50 * opt.scaleRate, 35 * opt.scaleRate, 35 * opt.scaleRate).attr({
                        'href': _otherTextInfo['link'],
                        'target': _otherTextInfo['linkTarget']
                    });
                    (function(obj) {
                        _otherText.hover(function(e) {
                            sharpHover(e, obj);
                        }, function(e) {
                            sharpOut(e, obj);
                        }).click(function(e) {
                            sharpClick(e, obj);
                        });
                    })(obj);
                }
            }
            // 添加底色面板
            if (opt.panleMask !== null && typeof opt.panleMask === 'object') {
                var panleMask_x = mapConfig.viewBox[0] - (opt.mapWidth * opt.scaleRate - mapConfig.viewBox[2]) / 2,
                    panleMask_y = mapConfig.viewBox[1] - (opt.mapHeight * opt.scaleRate - mapConfig.viewBox[3]) / 2,
                    panleMask_width = mapConfig.viewBox[2] + opt.mapWidth * opt.scaleRate - mapConfig.viewBox[2],
                    panleMask_height = mapConfig.viewBox[3] + opt.mapHeight * opt.scaleRate - mapConfig.viewBox[3];

                var panleMask_attr = $.extend(true, {
                    'fill': 'red',
                    'opacity': 0,
                    'stroke-width': 0
                }, opt.panleMask['attr'] || {});

                var panleMask = r.rect(panleMask_x, panleMask_y, panleMask_width, panleMask_height).attr(panleMask_attr).toBack();
                if (opt.panleMask['callback'] && typeof opt.panleMask['callback'] === 'function') {
                    opt.panleMask['callback'](panleMask);
                }
            }
            // 用户自定义内容
            opt.customModule && opt.customModule(r, opt);
            // 整体放大缩小
            r.changeSize(opt.mapWidth, opt.mapHeight, false, false);

            document.body.onmousemove = function(e) {
                var _$MapTip = $('#MapTip');
                if (!!_$MapTip) {
                    var _offsetXY = new offsetXY(e);
                    _$MapTip.css({
                        left: _offsetXY[0],
                        top: _offsetXY[1]
                    });
                }
            };
        }
        return SVGMap;
    })();

    $.fn.SVGMap = function(opts) {
        var $this = $(this),
            data = $this.data();

        if (data.SVGMap) {
            delete data.SVGMap;
        }
        if (opts !== false) {
            data.SVGMap = new SVGMap($this, opts);
        }
        return data.SVGMap;
    };
}(window, jQuery);
