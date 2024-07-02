/* eslint-disable @lwc/lwc/no-leading-uppercase-api-name */
import { LightningElement, api, track } from 'lwc';
import getFieldsAndRecords from '@salesforce/apex/FieldSetHelperForDataTables.getFieldsAndRecords';

export default class LwcCpq_ContractSubscriptions extends LightningElement {
	
	@api subrecordId;  // record id from record detail page
	@api subSFDCobjectApiName; //kind of related list object API Name
	@api subfieldSetName; // FieldSet which is defined on that above object
	@api subcriteriaFieldAPIName; // This field will be used in WHERE condition
	@api subfirstColumnAsRecordHyperLink; //if the first column can be displayed as hyperlink
	@track columns;   //columns for List of fields datatable
	@track tableData;   //data for list of fields datatable
	noDataMessage; //when we find no child records
	connectedCallback(){
		let firstTimeEntry = false;
		let firstFieldAPI;
		getFieldsAndRecords({ strObjectApiName: this.subSFDCobjectApiName,
								strfieldSetName: this.subfieldSetName,
								criteriaField: this.subcriteriaFieldAPIName,
								criteriaFieldValue: this.subrecordId
							})
		.then(data=>{        
			let objStr = JSON.parse(data);   
			let listOfFields= JSON.parse(Object.values(objStr)[1]);
			//retrieve listOfRecords from the map
			let listOfRecords = JSON.parse(Object.values(objStr)[0]);
			this.noDataMessage = listOfRecords.length === 0 ? true : false;
			let items = [];
			// eslint-disable-next-line array-callback-return
			listOfFields.map(element => {
				//it will enter this if-block just once
				if(this.subfirstColumnAsRecordHyperLink !=null && this.subfirstColumnAsRecordHyperLink === 'Yes'
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
									}
					];
					firstTimeEntry = true;
				} else {
					items = [...items ,{label: element.label, fieldName: element.fieldPath}];
				}   
			});
			//finally assigns item array to columns
			this.columns = items; 
			this.tableData = listOfRecords;
			if(this.subfirstColumnAsRecordHyperLink !=null && this.subfirstColumnAsRecordHyperLink === 'Yes'){
				let URLField;
				this.tableData = listOfRecords.map(item=>{
					URLField = '/lightning/r/' + this.subSFDCobjectApiName + '/' + item.Id + '/view';
					return {...item,URLField};
				});
				this.tableData = this.tableData.filter(item => item.fieldPath !== firstFieldAPI);
			}
			this.lblobjectName = this.subSFDCobjectApiName;
			this.recordCount = this.tableData.length;
			this.error = undefined;   
		})
		.catch(error =>{
			this.error = error;
			console.log('error',error);
			this.tableData = undefined;
			this.lblobjectName = this.subSFDCobjectApiName;
		})        
	}
}