from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains.question_answering import load_qa_chain
from langchain.llms import OpenAI
from langchain.vectorstores import ElasticsearchStore
from lib.config import Config

def pdf_to_pages(file):
    pdf_reader = PdfReader(file)
    pages = [] 
    for i, page in enumerate(pdf_reader.pages):
        pages.append({"page": str(i+1), "content": page.extract_text()})

    return pages

def processFilePDF(agent_id, path_file):
    pages = pdf_to_pages(path_file)
    
    embeddings = OpenAIEmbeddings()
    index_name = 'agent_vector_search'
    
    for page in pages:
        text_splitter = CharacterTextSplitter(chunk_size=2000, chunk_overlap=200)
        docs = text_splitter.create_documents([page.get("content")])
        if len(docs) > 0 :
            for i, doc in enumerate(docs):
                doc.metadata["link"] = path_file+"#page=" + page.get("page")
                doc.metadata["agent_id"] = agent_id

            ElasticsearchStore.from_documents(
                docs, embeddings, es_url=Config.ES_URL, index_name=index_name, 
            )