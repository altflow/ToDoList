/**
 * todo.js
 * simple to do list
 */

YAHOO.namespace("todo");

/**
 * manage settings
 * @module   Settings
 * @requires Event, JSON (YUI)
 * @return   function
 */
YAHOO.todo.Settings = function(){
	var YuiEvent = YAHOO.util.Event,
		YuiJson  = YAHOO.lang.JSON;

	var _oTodoUl       = document.getElementById("todo-list"),
		_oCompletedUl  = document.getElementById("completed-list"),
		_oReportLists  = document.getElementById("report-lists");
	
	/**
	 * clear all data
	 * @method {private} _onClickClearAll
	 */
	var _onClickClearAll = function(){
		YAHOO.log("clear all data");
		
		var sMessage = "Are you sure to clear ALL DATA?\n"
					 + "(You can't undo this oepration.)";
		
		if ( window.confirm(sMessage) ) {
			_oTodoUl.innerHTML      = "";
			_oCompletedUl.innerHTML = "";
			_oReportLists.innerHTML = "";
			YAHOO.todo.TaskData.clearAllData();
			YAHOO.todo.StatusMsg.display("All items have been removed", "info");
			YAHOO.todo.TaskList.init();
		}
	};
	
	/**
	 * clear all completed items
	 * @method {private} _onClickClearCompleted
	 */
	var _onClickClearCompleted = function(){
		YAHOO.log("clear all completed items");
		
		var sMessage = "Are you sure to clear ALL completed items?\n"
					 + "(You can't undo this oepration.)";
		
		if ( window.confirm(sMessage) ) {
			_oCompletedUl.innerHTML = "";
			_oReportLists.innerHTML = "";
			YAHOO.todo.TaskData.clearCompleted();
			YAHOO.todo.StatusMsg.display("All completed items have been removed", "info");
			YAHOO.todo.TaskList.init();
		}
	};
	
	/**
	 * fired when export link is clicked, and then
	 * display task data (JSON) in new window
	 * @method {private} _onClickExport
	 */
	var _onClickExport = function(){
		YAHOO.log("exporting task data in new window");
		var oTasks = YAHOO.todo.TaskData.getAllTaskData(),
			sTasks = YuiJson.stringify(oTasks);
		
		alert("Please save your task data in new window.");
		
		var oExportWindow = window.open();
		oExportWindow.document.open("text/javascript");
		oExportWindow.document.write(sTasks);
		oExportWindow.document.close();
	};
	
	/**
	 * fired when import button is clicked, then import task data
	 * @method {private} _onClickImport
	 * @param  {object}  Event
	 */
	var _onClickImport = function(oEvent){
		YAHOO.log("import buttom clicked");
		YuiEvent.preventDefault(oEvent);
		
		// validate required fields
		var oReplaceOption = document.forms["import-todo"]["import-option"][0].checked,
			oMergeOption   = document.forms["import-todo"]["import-option"][1].checked,
			oTaskDataEl    = document.forms["import-todo"]["todo-data"],
			sTaskData      = oTaskDataEl.value;
		
		// If imoprt option is not chosen, do not import.
		if ( !oReplaceOption && !oMergeOption ) {
			YAHOO.log("required field import-option is not chosen");
			YAHOO.todo.StatusMsg.display("Import option must be chosen.", "error");
			return false;
		}
		
		// Validate task data. It just checks the data type.
		try {
			var oTasks = YuiJson.parse(sTaskData);
			if ( !YAHOO.lang.isArray(oTasks["todo"]) ) {
				throw new TypeError("\"todo\" data is not array.")
			}
			if ( !YAHOO.lang.isArray(oTasks["completed"]) ) {
				throw new TypeError("\"completed\" data is not array.")
			}
		} catch (e) {
			YAHOO.log(e, "error");
			YAHOO.todo.StatusMsg.display("Please check your input data.<br/>" + e, "error");
			return false;
		}
		
		if (oReplaceOption) {
			// process import (replace)
			YAHOO.log("Replacing exsisting task data with the import data.");
			YAHOO.todo.TaskData.replaceTaskData(oTasks);
			
		} else if (oMergeOption) {
			// process import (merge)
			YAHOO.log("Merging the import data to existing task data.");
			YAHOO.todo.TaskData.mergeTaskLists("todo", oTasks["todo"]);
			YAHOO.todo.TaskData.mergeTaskLists("completed", oTasks["completed"]);
		}
		
		YAHOO.todo.TaskList.init();
		oTaskDataEl.value = "";
		YAHOO.todo.StatusMsg.display("Task Data have been imported.", "info")
	};
	
	// assigning event to import/export links
	YuiEvent.addListener("clear-all-data", "click", _onClickClearAll);
	YuiEvent.addListener("clear-completed", "click", _onClickClearCompleted);
	YuiEvent.addListener("export-data", "click", _onClickExport);
	YuiEvent.addListener("import-todo", "submit", _onClickImport);
}();

/**
 * manage status message
 * @module   StatusMsg
 * @requires ColorAnim, Event (YUI)
 * @return   function
 */
YAHOO.todo.StatusMsg = function(){
	var YuiColorAnim  = YAHOO.util.ColorAnim,
		YuiEvent      = YAHOO.util.Event;
	
	var _oStatusEl    = document.getElementById("status"),
	    _oFadeBgColor = {
	    	"error":   { from: "#faa", to: "#fdd" },
	    	"info":    { from: "#afa", to: "#dfd" },
	    	"warning": { from: "#ff9", to: "#ffc" }
	    };
	
	/**
	 * fired when undo link clicked
	 * @method {private} _onClickUndo
	 */
	var _onClickUndo = function(){
		YAHOO.log("undo link clicked");
		YAHOO.todo.TaskList.undo();
	};
	
	return {
		/**
		 * clear status message
		 * @method {public} clear
		 */
		clear: function(){
			_oStatusEl.className = "";
			_oStatusEl.innerHTML = "";
			_oStatusEl.style.backgroundColor = "transparent";
		},
		/**
		 * display status message
		 * @method {public} display
		 * @param  {string} Message
		 * @param  {string} Type of message
		 */
		display: function(sMessage, sType){
			YAHOO.log("display status message for type: " + sType);
			
			_oStatusEl.className = sType;
			_oStatusEl.innerHTML = sMessage;
			
			var oUndoDel = document.getElementById("undo-deletion") || false;
			if (oUndoDel) {
				YuiEvent.addListener(oUndoDel, "click", _onClickUndo);
			}
			
			var oFadeAnim = new YuiColorAnim(_oStatusEl, {
				backgroundColor: _oFadeBgColor[sType]
			}, 0.5);
			oFadeAnim.animate();
		}
	};
}();


/**
 * task data object
 * @module   TaskData
 * @requires JSON, StorageManager (YUI)
 * @return   function
 */
YAHOO.todo.TaskData = function(){
	var YuiJson           = YAHOO.lang.JSON,
		YuiStorageManager = YAHOO.util.StorageManager;
	
	YAHOO.log("initializing data");
	
	// Initialize storage engine and data
	var _oStorageEngine = YuiStorageManager.get(
		YAHOO.util.StorageEngineHTML5.ENGINE_NAME,
		YuiStorageManager.LOCATION_LOCAL,
		{
			order: [
				YAHOO.util.StorageEngineGears,
				YAHOO.util.StorageEngineSWF
			]
		}
	);
	// oStorageEngine.clear(); // clear all keys and values
	var _oTasks          = {};
	var tmp              = _oStorageEngine.getItem("todo");
	_oTasks["todo"]      = tmp ? YuiJson.parse(tmp) : [];
	tmp                  = _oStorageEngine.getItem("completed");
	_oTasks["completed"] = tmp ? YuiJson.parse(tmp) : [];
	var _aStuck          = [];
	
	YAHOO.log("task data is initialized");
	
	
	return {
		/**
		 * adding todo item data to todo list
		 * @method {public} addTodo
		 * @param  {string} Todo
		 * @return {object} TodoItem
		 */
		addTodo: function(sTodo){
			YAHOO.log("adding a new todo item data");
			
			var oNow      = new Date();
			var oTodoItem = {
				id:      _oStorageEngine.getItem("last-id")+1,
				task:    sTodo,
				created: oNow,
				updated: oNow
			};
			_oTasks["todo"].push(oTodoItem);
			_oStorageEngine.setItem("todo", YuiJson.stringify(_oTasks["todo"]));
			_oStorageEngine.setItem("last-id", oTodoItem["id"]);
			_oStorageEngine.setItem("last-updated", oNow);
			
			return oTodoItem;
		},
		/**
		 * adding completed task to completed list
		 * @method {public} addCompleted
		 * @param  {number} Id of completed todo item
		 * @return {object} CompletedItem
		 */
		addCompleted: function(nId){
			YAHOO.log("adding an item to completed list data");
			
			var oNow           = new Date(),
				nIndex         = this.getIndex("todo", nId),
				oCompletedItem = _oTasks["todo"].splice(nIndex, 1)[0];
				
			oCompletedItem["completed"] = oNow;
			oCompletedItem["updated"]   = oNow;
			
			_oTasks["completed"].unshift(oCompletedItem);
			
			_oStorageEngine.setItem("todo", YuiJson.stringify(_oTasks["todo"]));
			_oStorageEngine.setItem("completed", YuiJson.stringify(_oTasks["completed"]));
			_oStorageEngine.setItem("last-updated", oNow);
			
			return oCompletedItem;
		},
		/**
		 * clear all data
		 * @method {public} clearAllData
		 */
		clearAllData: function(){
			YAHOO.log("clear all data items");
			_oTasks = { "todo": [], "completed": [] };
			_oStorageEngine.clear();
		},
		/**
		 * clear all completed item data
		 * @method {public} clearCompleted
		 */
		clearCompleted: function(){
			YAHOO.log("clear all completed item data");
			_oTasks["completed"].length = 0;
			_oStorageEngine.setItem("completed", YuiJson.stringify(_oTasks["completed"]));
		},
		/**
		 * deleting a list item and put it into _aStuck
		 * @method {public} deleteItem
		 * @param  {string} ListType
		 * @param  {number} Id of list item
		 */
		deleteItem: function(sListType, nId){
			var nIndex = this.getIndex(sListType, nId);
			
			var oItem  = typeof(nIndex) === "number" ? _oTasks[sListType].splice(nIndex, 1)[0] : undefined;
			if (!oItem) {
				return false;
			}
			_oStorageEngine.setItem(sListType, YuiJson.stringify(_oTasks[sListType]));
			
			// store deleted item to stuck
			var oDeleted = {
				item: oItem,
				listType: sListType,
				indexNum: nIndex
			};
			_aStuck.unshift(oDeleted);
		},
		/**
		 * returns task data object
		 * @method {public} getAllTaskData
		 * @return {object} Tasks
		 */
		getAllTaskData: function(){
			return _oTasks;
		},
		/**
		 * returns index for given todo id
		 * @method {public} getIndex
		 * @param  {string} ListType (todo or completed)
		 * @param  {number} Id of todo item
		 * @return {number} Index of the array
		 */
		getIndex: function(sListType, nId){
			for (var nIndex=0, l=_oTasks[sListType].length; nIndex<l; nIndex++) {
				if (_oTasks[sListType][nIndex]["id"] == nId) {
					return nIndex;
				}
			}
			return false;		
		},
		/**
		 * returns array of todo items for specified list
		 * @method {public} getItems
		 * @param  {string} ListType
		 * @return {array}  TaskList
		 */
		getItems: function(sListType){
			// consolidate date format in the _oTasks
			var sJson = YuiJson.stringify(_oTasks[sListType]);
			
			return YuiJson.parse(sJson);
		},
		/**
		 * returns task string for given index from specified list
		 * @method {public} getTaskString
		 * @param  {string} ListType
		 * @param  {number} Index num
		 * @return {string} Item
		 */
		getTaskString: function(sListType, nIndex){
			return _oTasks[sListType][nIndex]["task"];
		},
		/**
		 * merge importing data to existing task list. tasks in same id
		 * will be overwritten based on the latest updated date
		 * @method {public} mergeTaskLists
		 * @param  {string} ListType
		 * @param  {array}  ListItems
		 */
		mergeTaskLists: function(sListType, aListItems){
			YAHOO.log("merging task list for " + sListType);
			var aTasks = _oTasks[sListType];
			
			for (var i=0, l=aListItems.length; i<l; i++){
				var nId      = aListItems[i]["id"],
					sTask    = aListItems[i]["task"],
					sCreated = aListItems[i]["created"],
					sUpdated = aListItems[i]["updated"];
				
				var nExistingIndex = this.getIndex(sListType, nId);
				
				if (nExistingIndex !== false) {
					YAHOO.log("same id " + nId + " exists in index " + nExistingIndex);
					var oTaskItem = aTasks[nExistingIndex];
					
					if (oTaskItem["updated"] < sUpdated) {
						YAHOO.log("overwrite task #" + nId + ", based on updated date (" + sUpdated + ")");
						oTaskItem["task"]    = sTask;
						oTaskItem["updated"] = sUpdated;
					}
				} else {
					aTasks.push(aListItems[i]);
				}
				
				if (nId > _oStorageEngine.getItem("last-id")) {
					_oStorageEngine.setItem("last-id", nId);
				}
			}
			
			_oStorageEngine.setItem(sListType, YuiJson.stringify(aTasks));
			_oStorageEngine.setItem("last-updated", new Date());
		},
		/**
		 * move todo item to destination in the list
		 * if destination is null, insert item at the end of todo list
		 * @method {public} moveItemTo
		 * @param  {number} Id of task item
		 * @param  {number|string} destination in the list
		 */
		moveItemTo: function(nId, destination){
			var sListType  = "todo",
				nIndex     = this.getIndex(sListType, nId);
				nDestIndex = destination > 0 ? this.getIndex(sListType, destination) : 0,
				oItem      = _oTasks[sListType].splice(nIndex, 1)[0],
				oNow       = new Date();
				
			if (destination == 0) {
				_oTasks[sListType].unshift(oItem);
				
			} else if (!destination) {
				_oTasks[sListType].push(oItem);
				
			} else {
				_oTasks[sListType].splice(nDestIndex, 0, oItem);
			}
			_oStorageEngine.setItem("todo", YuiJson.stringify(_oTasks[sListType]));
			_oStorageEngine.setItem("last-updated", oNow);
		},
		/**
		 * clear all existing tasks and add given task data
		 * @method {public} replaceTaskData
		 * @param  {object} Tasks
		 */
		replaceTaskData: function(oTasks){
			_oStorageEngine.setItem("todo", YuiJson.stringify(oTasks["todo"]));
			_oStorageEngine.setItem("completed", YuiJson.stringify(oTasks["completed"]));
			_oStorageEngine.setItem("last-updated", new Date());
			
			var tmp              = _oStorageEngine.getItem("todo");
			_oTasks["todo"]      = tmp ? YuiJson.parse(tmp) : [];
			tmp                  = _oStorageEngine.getItem("completed");
			_oTasks["completed"] = tmp ? YuiJson.parse(tmp) : [];
			
			// set last-id to increment id for new task
			var aTaskList = oTasks["todo"],
				aIds      = [],
				nMaxId    = 1;
				
			aTaskList = aTaskList.concat(oTasks["completed"]);
			
			for (var i=0, l=aTaskList.length; i<l; i++) {
				aIds.push(aTaskList[i]["id"]);
			}
			
			nMaxId = Math.max.apply(null, aIds);
			_oStorageEngine.setItem("last-id", nMaxId);
		},
		/**
		 * move specified completed item to todo list when check off
		 * @method {public} reviveCompleted
		 * @param  {number} Id of the item
		 * @return {object} Item of the revived task
		 */
		reviveCompleted: function(nId){
			var sListType = "completed",
				nIndex    = this.getIndex(sListType, nId);
				oItem     = _oTasks[sListType].splice(nIndex, 1)[0],
				oNow      = new Date();
			
			oItem["updated"]   = oNow;
			oItem["completed"] = "";
			_oTasks["todo"].push(oItem);
			
			// update todo list in local storage
			_oStorageEngine.setItem("todo", YuiJson.stringify(_oTasks["todo"]));
			_oStorageEngine.setItem("completed", YuiJson.stringify(_oTasks["completed"]));
			_oStorageEngine.setItem("last-updated", oNow);
			
			return oItem;
		},
		/**
		 * undo deleted item from _aStuck
		 * @method {public} undo
		 * @return {object} Deleted item to be undone
		 */
		undo: function(){
			var oDeleted  = _aStuck.shift();
			var oItem     = {
				id:        oDeleted["item"]["id"],
				task:      oDeleted["item"]["task"],
				created:   oDeleted["item"]["created"],
				completed: oDeleted["item"]["completed"],
				updated:   oDeleted["item"]["updated"]
			};
			
			var sListType = oDeleted["listType"],
				nIndex    = oDeleted["indexNum"];
			
			_oTasks[sListType].splice(nIndex, 0, oItem);
			_oStorageEngine.setItem(sListType, YuiJson.stringify(_oTasks[sListType]));
			
			return oDeleted;
		},
		/**
		 * update task data
		 * @method {public} updateTask
		 * @param  {string} ListType
		 * @param  {number} Index of array for the task
		 * @param  {string} Todo string
		 * @return {object} TaskItem
		 */
		updateTask: function(sListType, nIndex, sTodo){
			var oNow = new Date();
				
			_oTasks[sListType][nIndex]["task"]    = sTodo;
			_oTasks[sListType][nIndex]["updated"] = oNow;
			_oStorageEngine.setItem(sListType, YuiJson.stringify(_oTasks[sListType]));
			_oStorageEngine.setItem("last-updated", oNow);
			
			return _oTasks[sListType][nIndex];		
		}
	};
}();

/**
 * manage task filter for todo list by project name
 * @module   TaskFilter
 * @requires DOM, Event (YUI)
 * @return   {function}
 */
YAHOO.todo.TaskFilter = function(){
	var YuiDom    = YAHOO.util.Dom,
		YuiEvent  = YAHOO.util.Event;
	
	var _oFilters = {
		"ALL": "",
		"General": "general"
	};
	
	/**
	 * craete filter element with filter data (_oFilters)
	 * @method {private} _createFilter
	 * @return {object}  Filter HTML element
	 */
	var _createFilter = function(){
		var oUl       = document.createElement("ul"),
			aProjects = [];
		
		for (sKey in _oFilters) {
			aProjects.push(sKey);
		}
		aProjects.sort();
		
		for (var i=0, l=aProjects.length; i<l; i++) {
			var oLi      = document.createElement("li"),
				oProject = document.createTextNode(aProjects[i]+" ");
			
			oLi.id        = "project-" + aProjects[i];
			oLi.appendChild(oProject);
			
			YuiDom.addClass(oLi, "action-link");
			YuiEvent.addListener(oLi, "click", _onClickFilter, aProjects[i]);
			
			oUl.appendChild(oLi);
		}
			
		return oUl;
	};
	
	/**
	 * fired when a filter item clicked and then show only tasks
	 * belong to the clicked project
	 * @method {private} _onClickFilter
	 * @param  {object}  Event
	 * @param  {string}  Project
	 */
	var _onClickFilter = function(oEvent, sProject){
		var aListItems = YuiDom.getChildren("todo-list");
		aListItems = aListItems.concat(YuiDom.getChildren("completed-list"));

		var aDisplayItems = aListItems;
		
		if (_oFilters[sProject]) {
			aDisplayItems = YuiDom.getElementsByClassName(_oFilters[sProject]);
		} 
		
		// hide all items
		for (var i=0, l=aListItems.length; i<l; i++) {
			YuiDom.addClass(aListItems[i], "hidden");
		}
		
		// display items in specified project (or display all items)
		for (var i=0, l=aDisplayItems.length; i<l; i++) {
			YuiDom.removeClass(aDisplayItems[i], "hidden");
		}
		
		// change style of selected filter
		var aCurrentFilter = YuiDom.getElementsByClassName("current-filter");
		if (aCurrentFilter.length > 0) {
			YuiDom.removeClass(aCurrentFilter[0], "current-filter");
		}
		YuiDom.addClass("project-"+sProject, "current-filter");
	};
	
	return {
		/**
		 * add filter for given project name and
		 * assign the project name as class name
		 * @method {public} addFilter
		 * @param  {string} Project
		 * @param  {string} ClassName
		 */
		addFilter: function(sProject, sClassName){
			YAHOO.log("add filter for " + sProject + " with class " + sClassName);
			
			if (!_oFilters[sProject]) {
				_oFilters[sProject] = sClassName;
			}
		},
		/**
		 * clear filter items
		 * @method {public} clear
		 */
		clear: function(){
			_oFilters = {
				"ALL": "",
				"General": "general"
			};
		},
		/**
		 * parse task string and return the array of 
		 * the project name and task item (without project name)
		 * @method {public} parseTask
		 * @param  {string} Task
		 * @return {array}  ProjectTask
		 */
		parseTask: function(sTask){
			YAHOO.log("parsing task for " + sTask);
			
			var sProject = "General",
				oRegExp  = new RegExp(/^([a-zA-Z][a-zA-Z0-9]*):\s/);
			
			aProject = sTask.match(oRegExp);
			sTask    = aProject ? sTask.replace(oRegExp,"") : sTask;
			sProject = aProject ? aProject[1] : sProject;
			
			return [sProject, sTask];
		},
		/**
		 * render filter elements in the element with given id
		 * @method {public} render
		 * @param  {string} Id of target element
		 */
		render: function(sId){
			var oTarget        = document.getElementById(sId),
				oCurrentFilter = YuiDom.getElementsByClassName("current-filter")[0];
			
			oTarget.innerHTML = "";
			oTarget.appendChild(_createFilter());
			
			if (oCurrentFilter) {
				YuiDom.addClass(oCurrentFilter.id, "current-filter");
			} else {
				YuiDom.addClass("project-ALL", "current-filter");
			}
		}
	};
}();


/**
 * task item object with given id, task string, created, completed
 * and updated date
 * @module TaskItem
 * @require DOM, Event (YUI)
 * @param  {object} Item data
 * @return {object} ListItem element
 */
YAHOO.todo.TaskItem = function(oItem){
	YAHOO.log("creating list element for task #" + oItem["id"]);
	
	var YuiDom     = YAHOO.util.Dom,
		YuiEvent   = YAHOO.util.Event;
		
	var StatusMsg  = YAHOO.todo.StatusMsg,
		TaskData   = YAHOO.todo.TaskData,
		TaskFilter = YAHOO.todo.TaskFilter,
		TaskList   = YAHOO.todo.TaskList;
	
	var _nItemId      = oItem["id"],
		_sTask        = oItem["task"],
		_bCheckStatus = false,
		_sIdPrefix    = "item-";
		
	/**
	 * display edit form when edit link clicked
	 * @method {private} _onClickEdit
	 * @param  {object}  Event
	 * @param  {string}  Id of list item
	 */
	var _onClickEdit = function(oEvent, sId){
		YAHOO.log("editing item: " + sId);
		
		var nId       = sId.split("-")[2],
			oLi       = document.getElementById(sId),
			sListType = oLi.parentNode.id.split("-")[0];
			
		var nIndex = TaskData.getIndex(sListType, nId);
		
		TaskList.oListIndexEl.value = nIndex;
		TaskList.oTodoItemEl.value  = TaskData.getTaskString(sListType, nIndex);
		TaskList.oListTypeEl.value  = sListType;
		
		TaskList.oEditOverlay.cfg.setProperty("context", [sListType+"-"+nId, "tl", "tr"]);
		TaskList.oEditOverlay.show();
	};
	
	/**
	 * delete the list item
	 * @method {private} _onClickDelete
	 * @param  {object}  Event
	 * @param  {string}  Id of the list item
	 */
	var _onClickDelete = function(oEvent, sId){
		YAHOO.log("deleting item: " + sId);
		
		var nId       = sId.split("-")[2],
			oLi       = document.getElementById(sId),
			oUl       = oLi.parentNode,
			sListType = oUl.id.split("-")[0];
		
		var oDeleted = TaskData.deleteItem(sListType, nId);
		document.getElementById(sListType+"-list").removeChild(oLi);
		
		var sMessage = sListType + " item deleted."
					 + " (<span id='undo-deletion' class='action-link'>Undo Deletion</span>)";
		StatusMsg.display(sMessage, "warning");
	};
		
	var oListItem    = document.createElement("li"),
		oCheckbox    = document.createElement("input"),
		oItemText    = document.createTextNode(_sTask),
		oEditLink    = document.createElement("span"),
		oDeleteLink  = document.createElement("span");
	
	// make public properties to be inherited by subclass
	this.oListItem = oListItem;
	this.oCheckbox = oCheckbox;
	
	oListItem.id      = "list-item-" + _nItemId;
	
	oCheckbox.type    = "checkbox";
	oCheckbox.checked = _bCheckStatus;
	oCheckbox.id      = _sIdPrefix + _nItemId;
	
	// workaround for difference of onChange event on IE
	if (YAHOO.env.ua.ie > 0) {
		YuiEvent.addListener(oCheckbox, "click", function(oEvent){
			oCheckbox.blur();
			oCheckbox.focus();
		});
	}

	oEditLink.className          = "edit";
	oEditLink.innerHTML          = "Edit";
	oEditLink.style.visibility   = "hidden";
	YuiEvent.addListener(oEditLink, "click", _onClickEdit, oListItem.id);
	
	oDeleteLink.className        = "delete";
	oDeleteLink.innerHTML        = "Delete";
	oDeleteLink.style.visibility = "hidden";
	YuiEvent.addListener(oDeleteLink, "click", _onClickDelete, oListItem.id);
	
	oListItem.appendChild(oCheckbox);
	oListItem.appendChild(oItemText);
	oListItem.appendChild(oEditLink);
	oListItem.appendChild(oDeleteLink);
	YuiEvent.addListener(this.oListItem, "mouseover", function(){
		oEditLink.style.visibility   = "visible";
		oDeleteLink.style.visibility = "visible";
	});
	YuiEvent.addListener(this.oListItem, "mouseout", function(){
		oEditLink.style.visibility   = "hidden";
		oDeleteLink.style.visibility = "hidden";
	});
	
	var sProject = TaskFilter.parseTask(_sTask)[0];
	
	YuiDom.addClass(oListItem, sProject.toLowerCase());
	TaskFilter.addFilter(sProject, sProject.toLowerCase());
			
	return oListItem;
};

/**
 * completed item object extends TaskItem
 * @module CompletedItem
 * @param  {object} Item data
 * @return {object} ListItem
 */
YAHOO.todo.CompletedItem = function(oItem){
	YAHOO.log("creating list element for completed #" + oItem["id"]);
	
	// chain the constructors, pass oItem to superclass
	YAHOO.todo.CompletedItem.superclass.constructor.call(this, oItem);
	
	var YuiEvent = YAHOO.util.Event;
	var TaskList = YAHOO.todo.TaskList;
	
	var _nItemId      = oItem["id"],
		_bCheckStatus = true,
		_sIdPrefix    = "completed-";
	
	/**
	 * fired when checkbox changed
	 * @method {private} _onCheckChange
	 * @param  {object}   Event
	 * @param  {string}   Id of item
	 */
	var _onCheckChange = function(oEvent, sId){
		YAHOO.log("check status changed on " + sId);
		TaskList.reviveCompleted(sId);
	};
	
	var oCheckbox     = this.oCheckbox;
	oCheckbox.checked = _bCheckStatus;
	oCheckbox.id      = _sIdPrefix + _nItemId

	YuiEvent.addListener(oCheckbox, "change", _onCheckChange, oCheckbox.id);
	
	return this.oListItem;
};
// CompletedItem extends TaskItem
YAHOO.lang.extend(YAHOO.todo.CompletedItem, YAHOO.todo.TaskItem);

/**
 * todo item object extends TaskItem
 * @module TodoItem
 * @param  {object} Item data
 * @return {object} ListItem
 */
YAHOO.todo.TodoItem = function(oItem){
	YAHOO.log("creating list element for todo #" + oItem["id"]);
	
	// chain the constructors, pass oItem to superclass
	YAHOO.todo.CompletedItem.superclass.constructor.call(this, oItem);
	
	var YuiColorAnim   = YAHOO.util.ColorAnim,
		YuiDD          = YAHOO.util.DD,
		YuiDom         = YAHOO.util.Dom
		YuiDragDropMgr = YAHOO.util.DragDropMgr,
		YuiEvent       = YAHOO.util.Event;
		
	var TaskList = YAHOO.todo.TaskList,
		TaskData = YAHOO.todo.TaskData;
	
	var _nItemId      = oItem["id"],
		_bCheckStatus = false,
		_sIdPrefix    = "todo-"
		_oUl          = YuiDom.get("todo-list");
	
	/**
	 * clear style relevant of position
	 * @method {private} _clearPosition
	 * @param  {object}  Element
	 */
	var _clearPosition = function(oElement){
		oElement.style.position = "";
		oElement.style.left     = "";
		oElement.style.top      = "";
	};
	
	/**
	 * fired when checkbox changed
	 * @method {private} _onCheckChange
	 * @param  {object}  Event
	 * @param  {string}  Id of checkbox
	 */
	var _onCheckChange = function(oEvent, sId){
		YAHOO.log("check status changed on " + sId);
		TaskList.addCompleted(sId);
	};
	
	var oCheckbox     = this.oCheckbox; //public property of TaskItem
	oCheckbox.checked = _bCheckStatus;
	oCheckbox.id      = _sIdPrefix + _nItemId
	
	YuiEvent.addListener(oCheckbox, "change", _onCheckChange, oCheckbox.id);
	

	// Drag & Drop object, and define methods
	var oListItem = this.oListItem; //public property of TaskItem
	var oDDItem   = new YuiDD(oListItem);
	var _nLastY   = 0,
		_bGoingUp = false;
	
	/**
	 * fired when the drag ends. check if the dropped item
	 * stays inside of the ul#todo-list
	 * @method {private} endDrag
	 * @param  {object} Event
	 */
	oDDItem.endDrag = function(oEvent){
		YAHOO.log("endDrag event fired");
		var oSrcEl    = this.getEl(),
			oUlRegion = YuiDom.getRegion(_oUl);
			nPosY     = YuiEvent.getPageY(oEvent);
		
		if (nPosY < oUlRegion["top"]) {
			// if the element drag out top of the list, 
			// insert it as the first child of the list
			YuiDom.insertBefore(oSrcEl, _oUl.firstChild);
			TaskData.moveItemTo(_nItemId, 0);
		} else if (nPosY > oUlRegion["bottom"]) {
			// if the element drag out bottom of the list, 
			// insert it as the last child of the list
			_oUl.appendChild(oSrcEl);
			TaskData.moveItemTo(_nItemId);
		}
		_clearPosition(oSrcEl)
		YuiDom.removeClass(oSrcEl, "on-drag");
		YuiDragDropMgr.refreshCache();
	};
	
	/**
	 * fired when the item is dragging, checking direction of drag
	 * @method {private} onDrag
	 * @param  {object} Event
	 */
	oDDItem.onDrag = function(oEvent){
		var nPosY  = YuiEvent.getPageY(oEvent);
		
		YuiDom.addClass(this.getEl(), "on-drag")
		
		if (nPosY < _nLastY) {
			_bGoingUp = true;
		} else if (nPosY > _nLastY) {
			_bGoingUp = false;
		}
		_nLastY = nPosY;
	};
	
	/*
	 * fired when the item dropped and insert element to list
	 * in appropreate position
	 * @method {private} onDragDrop
	 * @param  {object} Event
	 * @param  {string} Id of element that the item hoverring
	 */
	oDDItem.onDragDrop = function(oEvent, sId){
		YAHOO.log("dragDropEvent fired for " + sId + ", going up: " + _bGoingUp);
		
		var oSrcEl  = this.getEl(),
			oDestEl = YuiDom.get(sId);
			
		var aTmp      = oDestEl.firstChild["id"].split("-");
		var sListType = aTmp[0],
			nDestId   = aTmp[1],
			nSrcId    = oSrcEl["id"].split("-")[2];
		
		if (oDestEl && oDestEl.nodeName.toLowerCase() == "li") {
			var oFadeAnim = new YuiColorAnim(oSrcEl, {
				backgroundColor: { from: "#ff9", to: "#fff" }
			}, 0.5);
			oFadeAnim.animate();
			
			TaskData.moveItemTo(nSrcId, nDestId);		
		} else {
			YAHOO.log("destination is not list", "warn");
		}
		YuiDom.removeClass(oSrcEl, "on-drag");
		_clearPosition(oSrcEl);
		YuiDragDropMgr.refreshCache();
	};
	
	/**
	 * fired when the item is drag over an element. this moves
	 * destination element for better usability
	 * @method {private} onDragOver
	 * @param  {object} Event
	 * @param  {string} Id of destination element
	 */
	oDDItem.onDragOver = function(oEvent, sId){
		YAHOO.log("dragOverEvent fired for " + sId + " , going up: " + _bGoingUp);
		
		var oSrcEl  = this.getEl(),
		    oDestEl = YuiDom.get(sId);
		
		// this applies only on list element
		
		if (oDestEl && oDestEl.nodeName.toLowerCase() == "li") {
			if (_bGoingUp) {
				YuiDom.insertBefore(oSrcEl, oDestEl);
			} else {
				YuiDom.insertAfter(oSrcEl, oDestEl);
			}
		    _clearPosition(oSrcEl)
		}
		
	};
	
	return oListItem;
};
// TodoItem extends TaskItem
YAHOO.lang.extend(YAHOO.todo.TodoItem, YAHOO.todo.TaskItem);


/**
 * manage list of tasks
 * @module  TaskList
 * @require ColorAnim, DOM, Event, JSON, KeyListener, Overlay (YUI)
 * @return  function
 */
YAHOO.todo.TaskList = function(){
	var YuiColorAnim   = YAHOO.util.ColorAnim,
		YuiDom         = YAHOO.util.Dom,
		YuiEvent       = YAHOO.util.Event,
		YuiJson        = YAHOO.lang.JSON,
		YuiKeyListener = YAHOO.util.KeyListener,
		YuiOverlay     = YAHOO.widget.Overlay;
		
	var StatusMsg      = YAHOO.todo.StatusMsg,
		TaskData       = YAHOO.todo.TaskData,
		TaskFilter     = YAHOO.todo.TaskFilter,
		TaskItem       = YAHOO.todo.TaskItem,
		CompletedItem  = YAHOO.todo.CompletedItem,
		TodoItem       = YAHOO.todo.TodoItem;
		
	var _oTodoUl       = document.getElementById("todo-list"),
		_oCompletedUl  = document.getElementById("completed-list");
	
	/**
	 * adding todo item to todo list
	 * @method {private} _addTodo
	 * @param  {object}  Event
	 */
	var _addTodo = function(oEvent){
		YAHOO.log("adding a new todo item");
		YuiEvent.preventDefault(oEvent);
		
		var oInput = document.getElementById("new-todo"),
			sTodo  = oInput.value;
			
		if (sTodo.match(/[^\s　\t]/)) {
			var oTodoItem = TaskData.addTodo(sTodo);
			
			// append list element to #todo-list
			var oLi      = TodoItem(oTodoItem);
			document.getElementById("todo-list").appendChild(oLi);
			
			var oFadeAnim = new YuiColorAnim(oLi, {
				backgroundColor: { from: "#ff9", to: "#fff" }
			}, 0.5);
			oFadeAnim.animate();
			
		}
		
		oInput.value = "";
		StatusMsg.clear();
		TaskFilter.render("project-filter-container");		
	};
	
	/**
	 * update task item string and hide edit form
	 * @method {private} _updateTask
	 * @param  {object}  Event
	 */
	var _updateTask = function(oEvent){
		YAHOO.log("updating a todo item");
		YuiEvent.preventDefault(oEvent);
		
		var oInput     = document.getElementById("todo-item"),
			sTodo      = oInput.value,
			oListType  = document.getElementById("list-type"),
			sListType  = oListType.value,
			oListIndex = document.getElementById("list-index"),
			nIndex     = oListIndex.value,
			oNow       = new Date();
		
		if (sListType !== "" && nIndex !== "") {
			var oTodoItem = TaskData.updateTask(sListType, nIndex, sTodo);
			
			var oCheckbox = document.getElementById(sListType+"-"+oTodoItem["id"]);
			oCheckbox.nextSibling.nodeValue = sTodo;
			
			var oFadeAnim = new YuiColorAnim(oCheckbox.parentNode, {
				backgroundColor: { from: "#ff9", to: "#fff" }
			}, 0.5);
			oFadeAnim.animate();

			var sProject = TaskFilter.parseTask(sTodo)[0];
			
			oCheckbox.parentNode.className = "";
			YuiDom.addClass(oCheckbox.parentNode, sProject.toLowerCase());
			TaskFilter.addFilter(sProject, sProject.toLowerCase());
		};
		
		oInput.value     = "";
		oListType.value  = "";
		oListIndex.value = "";
		oEditOverlay.hide();
		
		StatusMsg.clear();
		TaskFilter.render("project-filter-container");
	};
	
	// public property of edit todo item (yui overlay)
	var oEditOverlay = new YuiOverlay("edit-form", { visible: false });
	oEditOverlay.render();
	// event listener to hide edit todo item form when cancel button clicked
	YuiEvent.addListener("cancel-update", "click", oEditOverlay.hide, oEditOverlay, true);
	// or esc key pressed
	var oKeyListener = new YuiKeyListener(document, {keys:27}, {
		fn: oEditOverlay.hide,
		scope: oEditOverlay,
		correctScope: true
	});
	oKeyListener.enable();
	
	// public properties for edit todo item form element
	var oListIndexEl = document.getElementById("list-index");	
	var oListTypeEl  = document.getElementById("list-type");
	var oTodoItemEl  = document.getElementById("todo-item");
	
	// assign event listeners
	YuiEvent.addListener("edit-todo", "submit", _updateTask); // update existing todo
	YuiEvent.addListener("add-todo", "submit", _addTodo); // submit new todo item
	
	return {
		// pubclic properties
		oEditOverlay: oEditOverlay,
		oListIndexEl: oListIndexEl,
		oListTypeEl:  oListTypeEl,
		oTodoItemEl:  oTodoItemEl,
		/**
		 * adding checked todo item to completed list
		 * @method {public} addCompleted
		 * @param  {string} Id of checkbox
		 */
		addCompleted: function(sId){
			var nId   = sId.split("-")[1];
			var oItem = TaskData.addCompleted(nId);
			var oLi   = CompletedItem(oItem);
			
			_oTodoUl.removeChild( document.getElementById(sId).parentNode );
			_oCompletedUl.insertBefore(oLi, _oCompletedUl.firstChild);
			
			var oFadeAnim = new YuiColorAnim(oLi, {
				backgroundColor: { from: "#ff9", to: "#fff" }
			}, 0.5);
			oFadeAnim.animate();
			
			StatusMsg.clear();
		},
		/**
		 * initialize task list
		 * @method {public} init
		 */
		init: function(){
			YAHOO.log("initialize tasklists");
			var aTaskLists = [
					{
						sListType: "todo",
						TaskItem: TodoItem,
						oUl: _oTodoUl
					},
					{
						sListType: "completed",
						TaskItem: CompletedItem,
						oUl: _oCompletedUl
					}
				];
			
			var oNow      = new Date(),
				oToday    = new Date(oNow.getFullYear(), oNow.getMonth(), oNow.getDate()),
				sToday    = YuiJson.stringify(oToday).replace(/"/g,"");
			
			
			TaskFilter.clear();
			
			for (var i=0, tlen=aTaskLists.length; i<tlen; i++) {
				var oFragment  = document.createDocumentFragment(),
					sListType  = aTaskLists[i]["sListType"],
					aListItems = TaskData.getItems(sListType);
				
				YAHOO.log(aListItems.length + " items found in " + sListType);
				
				for (var j=0, ilen=aListItems.length; j<ilen; j++) {
					if (sListType === "completed" && aListItems[j]["completed"] < sToday) {
						break; // do not display items that are completed before today
					}
					
					var oLi = aTaskLists[i]["TaskItem"](aListItems[j]);
					
					oFragment.appendChild(oLi);
				}
				aTaskLists[i]["oUl"].innerHTML = "";
				aTaskLists[i]["oUl"].appendChild(oFragment);
			}
			TaskFilter.render("project-filter-container");
		},
		/**
		 * revive completed item to todo list
		 * @method {public} reviveCompleted
		 * @param  {string} Id of checkbox
		 */
		reviveCompleted: function(sId){
			YAHOO.log("revive completed item to todo list");
			var nId   = sId.split("-")[1],
				oItem = TaskData.reviveCompleted(nId),
				oLi   = TodoItem(oItem);
			
			_oCompletedUl.removeChild( document.getElementById(sId).parentNode );
			_oTodoUl.appendChild(oLi);
			
			var oFadeAnim = new YuiColorAnim(oLi, {
				backgroundColor: { from: "#ff9", to: "#fff" }
			}, 0.5);
			oFadeAnim.animate();
			
			StatusMsg.clear();			
		},
		/**
		 * undo a deleted item
		 * @method {public} undo
		 */
		undo: function(){
			var oItemUndo = TaskData.undo(),
				oItem     = {
					id:        oItemUndo["item"]["id"],
					task:      oItemUndo["item"]["task"],
					created:   oItemUndo["item"]["created"],
					completed: oItemUndo["item"]["completed"],
					updated:   oItemUndo["item"]["updated"]
				},
				nIndex    = oItemUndo["indexNum"];
			
			if (oItemUndo["listType"] === "todo") {
				var oUl     = _oTodoUl,
					oLi     = TodoItem(oItem);
			} else {
				var oUl     = _oCompletedUl,
					oLi     = CompletedItem(oItem);
			}
			
			var oTarget = oUl.childNodes[nIndex] || null;
			oUl.insertBefore(oLi, oTarget);
			
			var oFadeAnim = new YuiColorAnim(oLi, {
				backgroundColor: { from: "#ff9", to: "#fff" }
			}, 0.5);
			oFadeAnim.animate();
			
			StatusMsg.clear();
		}
	};
}();

/**
 * manage task report
 * @module   TaskReport
 * @requires Calendar, DateMath, Event, JSON (YUI)
 * @return   function
 */
YAHOO.todo.TaskReport = function(){
	var YuiCalendar = YAHOO.widget.Calendar,
		YuiDateMath = YAHOO.widget.DateMath,
		YuiEvent    = YAHOO.util.Event,
		YuiJson     = YAHOO.lang.JSON;
	
	var TaskData    = YAHOO.todo.TaskData,
		TaskFilter  = YAHOO.todo.TaskFilter;
	
	var oFilterType = document.forms["report-filter-type"];
	
	/**
	 * return start and end date of the week for given date
	 * @method {private} _getRangeOfWeek
	 * @param  {object}  Date
	 * @return {array}   DateRange [oStartDay, oEndDay, sDateRange]
	 */
	var _getRangeOfWeek = function(oDate){
		var oStartDay  = YuiDateMath.getFirstDayOfWeek(oDate, 1),
			sStartDay  = (oStartDay.getMonth()+1) + "/" + oStartDay.getDate() + "/" + oStartDay.getFullYear(),
			oEndDay    = new Date(oDate.setTime( oStartDay.getTime()+(6*24*3600*1000) )),
			sEndDay    = (oEndDay.getMonth()+1) + "/" + oEndDay.getDate() + "/" + oEndDay.getFullYear(),
			sDateRange = sStartDay+"-"+sEndDay;
		return [oStartDay, oEndDay, sDateRange];
	};
	
	/**
	 * select calendar date(s) and filter report
	 * @method {private} _onClickCalendarDate
	 * @param  {object}  Event
	 * @param  {array}   Date
	 * @param  {object}  Calendar (YUI)
	 */
	var _onClickCalendarDate = function(oEvent, aDate, oCalendar){
		var oDate         = this.toDate(aDate[0][0]);
			oStartDay     = oDate,
			oEndDay       = null,
			oFilterWeekly = oFilterType["report-type"][1].checked;
		
		YAHOO.log("date " + oDate + " is clicked");	
		
		if (oFilterWeekly) {
			var aDateRange = _getRangeOfWeek(oDate),
				oEndDay    = aDateRange[1];
				
			oStartDay      = aDateRange[0];
			this.cfg.setProperty("selected", aDateRange[2]);
			this.render();
		}
		
		_show(oStartDay, oEndDay);
	};
		
	/**
	 * display completed tasks for filtered period
	 * @method {private} _show
	 * @param  {object}  DateFrom
	 * @param  {object}  DateTo
	 */
	var _show = function(oDateFrom, oDateTo){
		var aProject   = [],
			oTasks     = {},
			aCompleted = TaskData.getItems("completed"),
			oFragment  = document.createDocumentFragment();
		
		oDateTo = oDateTo ? oDateTo : new Date(oDateFrom);
		oDateTo.setTime( oDateTo.getTime()+(24*3600*1000) );
		
		// convert date to string to compare taskdata in json string
		var sDateFrom = YuiJson.stringify(oDateFrom).replace(/"/g,""),
			sDateTo   = YuiJson.stringify(oDateTo).replace(/"/g,"");
		
		YAHOO.log("display completed items in " + sDateFrom + " - " + sDateTo);
		
		// grouping completed task by project for specified report period
		for (var i=0, l=aCompleted.length; i<l; i++) {
			var sCompleted = aCompleted[i]["completed"];
			
			// if the task completed in the specified date range added to the report data
			if (sCompleted >= sDateFrom && sCompleted < sDateTo) {
				var aProjectTask = TaskFilter.parseTask(aCompleted[i]["task"]),
					sProject     = aProjectTask[0],
					sTask        = aProjectTask[1];
				
				if (!oTasks[sProject]) {
					aProject.push(sProject);
					oTasks[sProject] = [];
				}
				oTasks[sProject].push(sTask);							
			}
			
			if (sCompleted < oDateFrom) {
				break;
			}
		}
		aProject.sort();
		
		// create task list for each project
		for (var i=0, nPlen=aProject.length; i<nPlen; i++){
			var sPjName = aProject[i],
				oH3     = document.createElement("h3"),
				sTitle  = document.createTextNode(aProject[i]),
				oUl     = document.createElement("ul");
			
			oH3.appendChild(sTitle);
			oFragment.appendChild(oH3);
			
			for (var j=0, nTlen=oTasks[sPjName].length; j<nTlen; j++){
				var oLi   = document.createElement("li"),
					sTask = document.createTextNode(oTasks[sPjName][j]);
				
				oLi.appendChild(sTask);
				oUl.appendChild(oLi);
			}
			oFragment.appendChild(oUl);
		}
		
		var oDiv = document.getElementById("report-lists");
		oDiv.innerHTML = "";
		oDiv.appendChild(oFragment);
	};
	
	var oDate             = new Date(),
		oRangeOfWeek      = _getRangeOfWeek(oDate),
		sDefaultSelection = oRangeOfWeek[2];
		
	YAHOO.log("Set default date selection: " + sDefaultSelection);
	
	// create YUI calendar
	var _oCalendar = new YuiCalendar("date-selector", "calendar", {
		selected: sDefaultSelection,
		START_WEEKDAY: 1
	});
	_oCalendar.render();
	
	// assigning event to calendar
	_oCalendar.selectEvent.subscribe(_onClickCalendarDate, _oCalendar, true);
	
	// display report for default period
	_show(oRangeOfWeek[0], oRangeOfWeek[1]);
}();

YAHOO.util.Event.onDOMReady(function(){
	var oLogConf = {
		width:  "20em",
		height: "20em",
		right:  "0px",
		top:    "0px"
	};
	//var logger = new YAHOO.widget.LogReader(null, oLogConf);
	
	var tabnav = new YAHOO.widget.TabView("bd");
	tabnav.addListener("activeTabChange", YAHOO.todo.StatusMsg.clear);
	var todo   = YAHOO.todo.TaskList.init(); 
});