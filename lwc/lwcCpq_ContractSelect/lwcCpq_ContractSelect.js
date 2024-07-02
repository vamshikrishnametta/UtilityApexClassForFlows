/* eslint-disable @lwc/lwc/no-api-reassignments */
/* eslint-disable @lwc/lwc/no-leading-uppercase-api-name */
import { LightningElement, api, track } from 'lwc';
import getFieldsAndRecords from '@salesforce/apex/FieldSetHelperForDataTables.getFieldsAndRecords';
import { FlowAttributeChangeEvent,FlowNavigationNextEvent } from 'lightning/flowSupport';

export default class LwcCpq_ContractSelect extends LightningElement {
	
	@api recordId;  // record id from record detail page
	@api SFDCobjectApiName; //kind of related list object API Name
	@api fieldSetName; // FieldSet which is defined on that above object
	@api criteriaFieldAPIName; // This field will be used in WHERE condition
	@api firstColumnAsRecordHyperLink; //if the first column can be displayed as hyperlink
	@api inputValueList = [];
	@track columns;   //columns for List of fields datatable
	@track tableData;   //data for list of fields datatable
	//Child Component values
	@api subrecordId;
	@api subSFDCobjectApiName = 'SBQQ__Subscription__c';
	@api subfieldSetName;
	@api subcriteriaFieldAPIName = 'SBQQ__Contract__c';
	@api subfirstColumnAsRecordHyperLink;
	//output to flow
	@api contractId;
	@api contractEndDate;
	recordCount; //this displays record count inside the ()
	lblobjectName; //this displays the Object Name whose records are getting displayed
	
	@track openModal = false;
	@track selectedContractRow = [];
	@api availableActions = [];
	noDataMessage; //when we find no child records
	connectedCallback(){
		let firstTimeEntry = false;
		let firstFieldAPI;
		this.contractEndDate = undefined;
		this.contractId = undefined;

		//make an implicit call to fetch records from database
		getFieldsAndRecords({ strObjectApiName: this.SFDCobjectApiName,
								strfieldSetName: this.fieldSetName,
								criteriaField: this.criteriaFieldAPIName,
								criteriaFieldValue: this.recordId,
								listOfRecords: this.inputValueList
							})
		.then(data=>{        
			//get the entire map
			let objStr = JSON.parse(data);   
			
			/* retrieve listOfFields from the map,
			 here order is reverse of the way it has been inserted in the map */
			let listOfFields= JSON.parse(Object.values(objStr)[1]);
			
			//retrieve listOfRecords from the map
			let listOfRecords = JSON.parse(Object.values(objStr)[0]);

			let items = []; //local array to prepare columns

			/*if user wants to display first column has hyperlink and clicking on the link it will
				naviagte to record detail page. Below code prepare the first column with type = url
			*/
			// eslint-disable-next-line array-callback-return
			listOfFields.map(element => {
				//it will enter this if-block just once
				if(this.firstColumnAsRecordHyperLink !=null && this.firstColumnAsRecordHyperLink === 'Yes'
														&& firstTimeEntry === false){
					firstFieldAPI  = element.fieldPath; 
					//perpare first column as hyperlink
					items = [...items ,
									{
										label: element.label, 
										fieldName: 'URLField',
										fixedWidth: 150,
										type: 'url', 
										typeAttributes: { 
											label: {
												fieldName: element.fieldPath
											},
											target: '_blank'
										},
										sortable: true 
									},
									{
										label: "Show Subscriptions",
										type: "button",
										typeAttributes: {
											label: "View Subscriptions", //{ fieldName: "SomeField__c" } if we want to patch model link to a field
											name: "view",
											variant: "base"
										}
									}
					];
					firstTimeEntry = true;
				} else {
					items = [...items ,{label: element.label, 
						fieldName: element.fieldPath}];
				}   
			});
			//finally assigns item array to columns
			this.columns = items; 
			this.tableData = listOfRecords;

			this.noDataMessage = listOfRecords.length === 0 ? true : false;

			/*if user wants to display first column has hyperlink and clicking on the link it will
				naviagte to record detail page. Below code prepare the field value of first column
			*/
			if(this.firstColumnAsRecordHyperLink !=null && this.firstColumnAsRecordHyperLink === 'Yes'){
				let URLField;
				//retrieve Id, create URL with Id and push it into the array
				this.tableData = listOfRecords.map(item=>{
					URLField = '/lightning/r/' + this.SFDCobjectApiName + '/' + item.Id + '/view';
					return {...item,URLField};
				});
				
				//now create final array excluding firstFieldAPI
				this.tableData = this.tableData.filter(item => item.fieldPath  !== firstFieldAPI);
			}

			//assign values to display Object Name and Record Count on the screen
			this.lblobjectName = this.SFDCobjectApiName;
			this.recordCount = this.tableData.length;
			this.error = undefined;   
		})
		.catch(error =>{
			this.error = error;
			console.log('error',error);
			this.tableData = undefined;
			this.lblobjectName = this.SFDCobjectApiName;
		})        
	}

	showSubscriptions(event) {
		const selectedValue = event.detail.row.Id;
		const actionName = event.detail.action.name;
		if(actionName === "view") {
			// init your modal here
			this.openModal = true;
			this.subrecordId = selectedValue;
			this.subfieldSetName = 'SubscriptionTableFields';
			this.subfirstColumnAsRecordHyperLink = 'Yes';
		}
	}

	// eslint-disable-next-line consistent-return
	handleSelectContract(){
		var selectRows; 
		var selectedRecord;
		var tempList = [];
		
        selectRows = this.template.querySelector('lightning-datatable').getSelectedRows();
        selectRows.forEach(record => {
            tempList.push(record);
        });
        if(tempList.length > 0){
            selectedRecord = tempList[0];
            this.dispatchEvent(new FlowAttributeChangeEvent('contractId', selectedRecord.Id));
            this.dispatchEvent(new FlowAttributeChangeEvent('contractEndDate', selectedRecord.EndDate));
            this.contractId = selectedRecord.Id;
            this.contractEndDate = selectedRecord.EndDate;
        }

		
		if(!this.contractEndDate){
			this.template.querySelector('c-common-toast').showToast('error','<strong>Please make sure to select at least one option.<strong/>','utility:error',30000);
			return;
		}

		// check if NEXT is allowed on this screen
		if (this.availableActions.find((action) => action === 'NEXT')) {
			// navigate to the next screen
			const navigateNextEvent = new FlowNavigationNextEvent();
			this.dispatchEvent(navigateNextEvent);
		}
	}

	closeShowSubscriptions(){
		this.openModal = false;
	}


}