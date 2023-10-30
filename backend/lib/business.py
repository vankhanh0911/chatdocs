import os
from elasticsearch import Elasticsearch
from lib.config import Config
from worker import crawlerUrl, processFilePdf

class Business:
    def __init__(self):
        self.es = Elasticsearch(hosts=Config.ES_URL)

    def saveAgent(self, parameter: dict):
        input_type = parameter.get("inputType")

        if input_type not in ("link", "upload", "default"):
            return "error"
        
        document = {
            'agent_name': parameter.get("name"),
            'description': parameter.get("description"),
            'input_type': parameter.get("inputType"),
            'url': parameter.get("url") or "",
            'selector': parameter.get("selector") or "",
            'file': parameter.get("file") or "",
            "folder_id": parameter.get("folderId") or ""
        }

        result = self.es.index(
            index='agents',
            document=document)
        
        if result and result.get("_id") != "":
            # send job parse and store vector
            if input_type == "link":
                crawlerUrl.delay(result.get("_id"), parameter.get("url"), parameter.get("selector"))
            elif input_type == "upload":
                processFilePdf.delay(result.get("_id"), parameter.get("file"))
                    
        return result
    
    def getAgent(self, agentId):
        return self.es.get(
            index='agents',
            id=agentId
        )
    
    def getPages(self, parameter: dict):
        agent_id = parameter.get("agent_id")
        
        result = self.es.search(index="agent_vector_search", query={"match": {"metadata.agent_id.keyword": agent_id}}, source_includes=["metadata"], size=1000)

        list_pages = result.get('hits').get('hits')

        responses = []
        for page in list_pages:
            print(page)
            metadata = page.get("_source").get("metadata")
            if metadata:
                link = metadata.get("link")
                responses.append({'id': page.get("_id"), "link": link})

        return responses