# Project Chat with Docs

## Overview

The **Chat with Docs** project is a simple application that allows users to engage in text-based conversations with docs(can be a pdf file, or a link docs of some company). This README provides an overview of the project, installation instructions, usage guidelines, and other relevant information to help you get started.

### Features

- Real-time text-based chat functionality.
- Export chat conversations
- Upload pdf file and chat with file
- Input URL crawler to chat with url

## Installation

Follow these steps to set up the **Chat with Docs** project on your local machine:

1. Clone the repository to your local system:

   ```bash
   git clone https://github.com/vankhanh0911/chatdocs.git
    ```
2. Start BE
    ```bash
    cd chatdocs && docker compose up -d
    ```
3. Start frontend
    ```
    cd frontend && yarn && yarn dev
    ```