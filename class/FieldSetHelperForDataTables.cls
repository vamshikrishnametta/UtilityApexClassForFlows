public with sharing class FieldSetHelperForDataTables {
	@AuraEnabled (cacheable=true)
	public static String getFieldsAndRecords(String strObjectApiName, String strfieldSetName,
												String criteriaField, String criteriaFieldValue, List<sObject> listOfRecords){
		Map<String, String> returnMap = new Map<String,String>();
		if(String.isNotEmpty(strObjectApiName) && String.isNotEmpty(strfieldSetName)){
			//get fields from FieldSet
			SObject sObj = (SObject)(Type.forName('Schema.'+ strObjectApiName).newInstance());
			List<Schema.FieldSetMember> lstFSMember = 
				sObj.getSObjectType().getDescribe().fieldSets.getMap().get(strfieldSetName).getFields();
			//prepare SOQL query based on fieldAPIs	
			String query = 'SELECT ';
			for(Schema.FieldSetMember f : lstFSMember) {
				query += f.getFieldPath() + ', ';
			}
			query += 'Id FROM ' + strObjectApiName ;
			Set<Id> IdSet = new Set<Id>();
			//let's do in future .get also dynamic and multi field values
			if(listOfRecords != null){
				for(sObject obj: listOfRecords) {
					IdSet.add((String)obj.get('Id'));
				}
			}
			//Just in case criteria field not specified then it will return all records
			if(String.isNotEmpty(criteriaField) && String.isNotEmpty(criteriaFieldValue)){
				query += ' WHERE ' + criteriaField + '=\'' + criteriaFieldValue + '\'';
			} else{
				query += ' WHERE Id IN'+':IdSet';
			}
			//execute query
			List<SObject> lstRecords = Database.query(query);
			//prepare a map which will hold fieldList and recordList and return it
			returnMap.put('FIELD_LIST', JSON.serialize(lstFSMember));
			returnMap.put('RECORD_LIST', JSON.serialize(lstRecords));
			return JSON.serialize(returnMap);
		}
		return null;
	}
}