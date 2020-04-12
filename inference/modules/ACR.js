"use strict";
/**
 * ACR module - holds JS definitions of different primitive classes and useful
 * utility functions for manipulating the primitives.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Dependencies.
var geometry_1 = require("./geometry");
var ACRObject = /** @class */ (function () {
    function ACRObject(_a) {
        var id = _a.id, _parent = _a.parent, type = _a.type, _b = _a.vertices, vertices = _b === void 0 ? [] : _b, _c = _a.level, level = _c === void 0 ? 0 : _c;
        var xs = vertices.map(function (_a) {
            var x = _a[0], _ = _a[1];
            return x;
        }).sort().reverse();
        var ys = vertices.map(function (_a) {
            var _ = _a[0], y = _a[1];
            return y;
        }).sort().reverse();
        var absoluteWidth = Math.abs(xs[0] - xs[xs.length - 1]);
        var absoluteHeight = Math.abs(ys[0] - ys[ys.length - 1]);
        if (!_parent) {
            _parent = {
                id: "None",
                meta: {
                    absoluteWidth: absoluteWidth,
                    absoluteHeight: absoluteHeight
                }
            };
            //console.log(`Constructing implicit parent object.`);
        }
        // let relativeWidthValue = absoluteWidth / parent.meta.absoluteWidth;
        // if (isNaN(relativeWidthValue)) relativeWidthValue = 0;
        // let relativeWidth = `${(relativeWidthValue) * 100}%`;
        // let relativeHeightValue = absoluteHeight / parent.meta.absoluteHeight;
        // if (isNaN(relativeHeightValue)) relativeHeightValue = 0;
        // let relativeHeight = `${(relativeHeightValue) * 100}%`;
        // console.log(`Called constructor with vertices:`, vertices, `and id`, id);
        // Maintain a reference to 'this' which can be used within the 'meta' object.
        var self = this;
        this.id = id;
        this.parentId = _parent.id;
        this._parent = _parent;
        this.type = type;
        this.draw = true;
        this.meta = {
            absoluteWidth: absoluteWidth,
            absoluteHeight: absoluteHeight,
            get relativeWidthValue() {
                //console.log(`Calculating relative width, with parent:`, self.parent, this.absoluteWidth, self.parent.meta.absoluteWidth, this);
                var relativeWidthValue = this.absoluteWidth / self.parent.meta.absoluteWidth;
                if (isNaN(relativeWidthValue))
                    relativeWidthValue = 0;
                return relativeWidthValue;
            },
            get relativeHeightValue() {
                var relativeHeightValue = this.absoluteHeight / self.parent.meta.absoluteHeight;
                if (isNaN(relativeHeightValue))
                    relativeHeightValue = 0;
                return relativeHeightValue;
            },
            get relativeWidth() {
                return this.relativeWidthValue * 100 + "%";
            },
            get relativeHeight() {
                return this.relativeHeightValue * 100 + "%";
            },
            get area() {
                return this.absoluteWidth * this.absoluteHeight;
            },
            vertices: vertices,
            // Save a copy of the initial vertices for the object for the purposes of
            // calculating resizing deltas, etc.
            initialVertices: vertices.concat(),
            get midpoint() {
                return geometry_1.calculateMidPoint(this.vertices);
            },
        };
        this.contains = [];
    }
    Object.defineProperty(ACRObject.prototype, "level", {
        get: function () {
            // Recursively traverse the parent tree until there are no more parents.
            var level = -1;
            var parent = this;
            while (parent && parent.parent) {
                parent = parent.parent;
                level++;
            }
            return level;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ACRObject.prototype, "parent", {
        get: function () {
            return this._parent;
        },
        set: function (newValue) {
            this._parent = newValue;
        },
        enumerable: true,
        configurable: true
    });
    ;
    ;
    ACRObject.prototype.addContainingShape = function (otherShape) {
        console.log("Adding", otherShape.id, "to", this.id);
        // Set the new parent ID for the other shape.
        otherShape.parentId = this.id;
        // Ensure that the other shape has this shape as its parent.
        otherShape.parent = this;
        // Adjust the relative width and height of the otherShape.
        //otherShape.meta.relativeWidth = `${(otherShape.meta.absoluteWidth / this.meta.absoluteWidth) * 100}%`;
        //otherShape.meta.relativeHeight = `${(otherShape.meta.absoluteHeight / this.meta.absoluteHeight) * 100}%`;
        // Adjust the relative vertices.
        var _a = this.meta.vertices[0], ox = _a[0], oy = _a[1];
        // for (var i = 0; i < otherShape.meta.vertices.length; i++){
        //   otherShape.meta.vertices[i] = [
        //     (otherShape.meta.vertices[i][0] - ox) / this.meta.absoluteWidth,
        //     (otherShape.meta.vertices[i][1] - oy) / this.meta.absoluteHeight,
        //   ];
        // }
        this.contains.push(otherShape);
    };
    // MARK: Constructor utilities.
    ACRObject.prototype.calculateMidPoint = function (vertices) {
        return vertices.length !== 0 ? [
            vertices.map(function (_a) {
                var x = _a[0], y = _a[1];
                return x;
            }).reduce(function (prev, curr) { return prev + curr; }) / vertices.length,
            vertices.map(function (_a) {
                var x = _a[0], y = _a[1];
                return y;
            }).reduce(function (prev, curr) { return prev + curr; }) / vertices.length
        ] : [];
    };
    // MARK: Movement operators.
    // Mutates the object, displacing it x units or y units.
    ACRObject.prototype.displace = function (_a) {
        var _b = _a.x, x = _b === void 0 ? 0 : _b, _c = _a.y, y = _c === void 0 ? 0 : _c;
        this.meta.vertices = this.meta.vertices.map(function (_a) {
            var xVert = _a[0], yVert = _a[1];
            return [xVert + x, yVert + y];
        });
        //this.meta.midpoint = calculateMidPoint(this.meta.vertices);
        // Displace all contained objects recursively.
        // TODO: Understand why contained acrObjects are undefined, or are not instances of the ACRObject class.
        this.contains.forEach(function (acrObject) { return acrObject.displace({ x: x, y: y }); });
    };
    // Non-mutating version of the above.
    ACRObject.prototype.displaced = function (deltas) {
        var displacedObject = ACRObject.fromJSON(__assign({}, this));
        displacedObject.displace(deltas);
        return displacedObject;
    };
    // Given a JSON ACR Object, which is not already an instance of the ACRObject class,
    // creates an instance of the ACRObject.
    ACRObject.fromJSON = function (json) {
        // If the incoming object is an array, map each json object to an ACRObject instance.
        if (Array.isArray(json))
            return json.map(function (acrObject) { return ACRObject.fromJSON(acrObject); });
        var startObject = new ACRObject({
            id: json.id,
            parent: json.parent,
            type: json.type,
            vertices: json.meta.vertices,
        });
        if (json.parentId)
            startObject.parentId = json.parentId;
        if (json.dragging)
            startObject.dragging = json.dragging;
        if (json.draw)
            startObject.draw = json.draw;
        if (json.id)
            startObject.id = json.id;
        if (json.meta.absoluteHeight)
            startObject.meta.absoluteHeight = json.meta.absoluteHeight;
        if (json.meta.absoluteWidth)
            startObject.meta.absoluteWidth = json.meta.absoluteWidth;
        // if (json.meta.relativeWidthValue)
        //   startObject.meta.relativeWidthValue = json.meta.relativeWidthValue;
        // if (json.meta.relativeHeightValue)
        //   startObject.meta.relativeHeightValue = json.meta.relativeHeightValue;
        // Assign 'initialVertices' if this has not been done already.
        //if (!startObject.meta.initialVertices) startObject.meta.initialVertices = startObject.meta.vertices.concat();
        // Recursively map all containing shapes to ACRObjects.
        // startObject.contains = ACRObject.fromJSON(json.contains).map(primitive => {return {...primitive, parent: startObject}});
        json.contains.forEach(function (jsonPrimitive) {
            startObject.addContainingShape(ACRObject.fromJSON(jsonPrimitive));
        });
        return startObject;
    };
    return ACRObject;
}());
exports.ACRObject = ACRObject;
var Rectangle = /** @class */ (function (_super) {
    __extends(Rectangle, _super);
    function Rectangle(_a) {
        var id = _a.id, parent = _a.parent, midpoint = _a.midpoint, vertices = _a.vertices, width = _a.width, height = _a.height, top = _a.top, left = _a.left, level = _a.level, type = _a.type;
        var _this = this;
        if (!type)
            type = "rectangle";
        if (!vertices && midpoint) {
            var mx = midpoint[0], my = midpoint[1];
            var dx = width / 2;
            var dy = height / 2;
            vertices = [
                [mx - dx, my - dy],
                [mx - dx, my + dy],
                [mx + dx, my + dy],
                [mx + dx, my - dy]
            ];
        }
        if (!vertices && left && top) {
            vertices = [
                [left, top],
                [left, top + height],
                [left + width, top + height],
                [left + width, top]
            ];
        }
        console.log("Created vertices:", left, top);
        _this = _super.call(this, { id: id, parent: parent, type: type, vertices: vertices, level: level }) || this;
        return _this;
    }
    return Rectangle;
}(ACRObject));
exports.Rectangle = Rectangle;
var Container = /** @class */ (function (_super) {
    __extends(Container, _super);
    function Container(params) {
        return _super.call(this, __assign({ type: "container" }, params)) || this;
    }
    return Container;
}(Rectangle));
exports.Container = Container;
var Row = /** @class */ (function (_super) {
    __extends(Row, _super);
    function Row(params) {
        return _super.call(this, __assign({ type: "row" }, params)) || this;
    }
    return Row;
}(Container));
exports.Row = Row;
