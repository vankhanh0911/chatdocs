import os
import queue
import argparse
from flask import Flask, Response, jsonify, request, abort
from flask_cors import CORS
from logzero import logger
import openai
from dotenv import load_dotenv
import tiktoken
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler

from werkzeug.utils import secure_filename

from lib import pdf, elastic, crawler, business

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

UPLOAD_FOLDER = 'static/uploads'
DOMAIN_NAME = os.getenv("DOMAIN_NAME")
ALLOWED_EXTENSIONS = {'pdf'}
# If its not relevant to the question, provide friendly responses.

# You have access to chat history, and can use it to help answer the question.
#     When using code examples, use the following format:
#     ```(language)
#     (code)
#     ```
# chat_combine_template = '''
#      You are a Antsomi Chatbot, friendly and helpful AI assistant that provides help with documents. You give through answers with code examples if possible.
#     Use the following pieces of context to help answer the users question. Do not use any information about features that are not mentioned in the PROVIDED CONTEXT.
#     If the context don't have enought infomation, you need to response "i don't know". We provide a link begin of each information from context, and if you use the context as knownledge to response message, , please anwser the link in the end and after text : "You can find more here:"
#     Context:
#     ----------------
#     {summaries}
# '''

chat_combine_external_template = '''
    You are a Antsomi Chatbot, friendly and helpful AI assistant that provides help with documents.
    Context:
    ----------------
    {summaries}
    ----------
    Task: Answer questions using the information from the above context. In case the context do not have enough information, you can use your knowledge to response to user.
    We provide a link begin of each peace of context, and if you use the context as knownledge to response message, please anwser the link in the end after text : "You can find more here:"
'''

chat_combine_template = '''
    You are a Antsomi Chatbot, friendly and helpful AI assistant that provides help with documents.
    Context:
    ----------------
    {summaries}
    ----------
    Task: Answer questions using solely the information from the above text. You must use the information from the above text, do not use any information.
    We provide a link begin of each peace of context, and if you use the context as knownledge to response message, please anwser the link in the end after text : "You can find more here:"
'''

def num_tokens_from_string(string: str, encoding_name: str) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def perform_request_with_streaming(body):
    agent = body.get("agent")
    agent_setting = body.get("agent_setting")

    external_knowledge = False
    lookup_type = "allPage"
    pages = []

    if agent:

        if agent_setting:
            external_knowledge = agent_setting.get("external_knowledge")
            lookup_type = agent_setting.get("lookup_type")
            pages = agent_setting.get("pages")

        agent_id = agent.get('id')
        agent_business = business.Business()
        try:
            agent_info = agent_business.getAgent(agent_id)
        except:
            agent_info = None

        if agent_info and agent_info.get('_source'):
            source = agent_info.get('_source')

            input_type = source.get('input_type')

            if input_type in ['link', 'upload']:
                es = elastic.Elastic(index_name='agent_vector_search')

                query=body.get("messages")[-1].get("content")
                
                if lookup_type == "allPage":
                    docs = es.vectorSearch(agent_id=agent_id, query=query)
                else:
                    #query with list pages
                    docs = es.pageSearch(pages)

                    print(docs)
                    
                if input_type == "link":
                    docs_together = "\n\n\n".join(["\n\nLink document: " + doc.metadata.get("link") + "\n Content:" + doc.page_content for doc in docs])
                else:
                    docs_together = "\n\n\n".join(["\n\nLink document: " + DOMAIN_NAME + "/" + doc.metadata.get("link") + "\n Content: " + doc.page_content for doc in docs])
                
                if external_knowledge:
                    chat_combine = chat_combine_external_template.replace("{summaries}", docs_together)
                else:
                    chat_combine = chat_combine_template.replace("{summaries}", docs_together)
                
                print(docs_together)

                messages_combine = [{"role": "system", "content": chat_combine}]

                chat_history = body.get("messages")
                chat_history.pop()
                chat_history.reverse()
                
                history_token = 0
                for i in chat_history:
                    if i.get("role") == "user":
                        token_count = num_tokens_from_string(i.get("content"), "cl100k_base")
                        if token_count + history_token < 2000:
                            history_token += token_count
                            messages_combine.append(i)
                    else:
                        message_bot = i.get('content')
                        splice_text = message_bot.split("\n\n You can find more here: \n\n")

                        assitant_message = splice_text[0]

                        token_count = num_tokens_from_string(assitant_message, "cl100k_base")

                        if token_count + history_token < 2000:
                            history_token += token_count
                            messages_combine.append({"role": i.get("role"), "content": assitant_message})
                        

                messages_combine.append({"role": "user", "content": query})
                
                for chunk in openai.ChatCompletion.create(
                    model="gpt-3.5-turbo-16k",
                    messages=messages_combine,
                    temperature=body.get("temperature"),
                    top_p=body.get("top_p"),
                    stream=True,
                    max_tokens=1000,
                    presence_penalty=body.get("presencePenalty"),
                    frequency_penalty=body.get("frequencyPenalty")):

                    content = chunk["choices"][0].get("delta", {}).get("content")
                    if content is not None:
                        yield content

            else:
                for chunk in openai.ChatCompletion.create(
                    model="gpt-3.5-turbo-16k",
                    messages=body.get("messages"),
                    temperature=body.get("temperature"),
                    top_p=body.get("top_p"),
                    stream=True,
                    max_tokens=1000,
                    presence_penalty=body.get("presencePenalty"),
                    frequency_penalty=body.get("frequencyPenalty")):

                    content = chunk["choices"][0].get("delta", {}).get("content")
                    if content is not None:
                        yield content 
        else:
            for chunk in openai.ChatCompletion.create(
                model="gpt-3.5-turbo-16k",
                messages=body.get("messages"),
                temperature=body.get("temperature"),
                top_p=body.get("top_p"),
                stream=True,
                max_tokens=1000,
                presence_penalty=body.get("presencePenalty"),
                frequency_penalty=body.get("frequencyPenalty")):

                content = chunk["choices"][0].get("delta", {}).get("content")
                if content is not None:
                    yield content 
    else:
        for chunk in openai.ChatCompletion.create(
            model="gpt-3.5-turbo-16k",
            messages=body.get("messages"),
            temperature=body.get("temperature"),
            top_p=body.get("top_p"),
            stream=True,
            max_tokens=1000,
            presence_penalty=body.get("presencePenalty"),
            frequency_penalty=body.get("frequencyPenalty")):

            content = chunk["choices"][0].get("delta", {}).get("content")
            if content is not None:
                yield content            


def create_app(config=None):
    app = Flask(__name__, static_url_path='/static')

    app.config.update(dict(DEBUG=True))
    app.config.update(config or {})
    app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

    CORS(app)

    @app.route("/")
    def welcome():
        logger.info("/")
        return "Welcome to Antsomi Chatbot API"

    @app.route("/api/chat", methods=['POST'])
    def chat():
        data = request.json
        return Response(perform_request_with_streaming(data), mimetype="text/event-stream")

    @app.route('/api/upload', methods=['POST'])
    def upload_file():
        if 'file' not in request.files:
            return abort(400, 'File not found')
        file = request.files['file']

        if file.filename == '':
            return abort(400, 'No selected file')

        if not allowed_file(file.filename):
            return abort(400, 'File name not allowed')

        filename = secure_filename(file.filename)
        final_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        file.save(final_path)

        return jsonify({"message": "ok", "data": {"fileUrl": final_path}})
    
    @app.route('/api/agent', methods=['POST'])
    def saveAgent():
        data = request.json
        save_agent_business = business.Business()

        response = save_agent_business.saveAgent(data)

        return jsonify({"message": "ok", "data": {"agentId": response.get("_id")}})
    
    @app.route('/api/page/list', methods=['POST'])
    def getListPage():
        data = request.json
        save_agent_business = business.Business()

        pages = save_agent_business.getPages(data)

        return jsonify({"message": "ok", "data": {"pages": pages}})
    
    # @app.route('/api/agent/:id', methods=['GET'])
    # def getAgent():
    #     data = request.json
    #     save_agent_business = business.Business()

    #     response = save_agent_business.saveAgent(data)

    #     return jsonify({"message": "ok", "data": {"agentId": response.get("_id")}})

    return app


if __name__ == "__main__":
    port = int(os.getenv("PORT"))
    app = create_app()
    app.run(host="0.0.0.0", port=port, threaded=True)