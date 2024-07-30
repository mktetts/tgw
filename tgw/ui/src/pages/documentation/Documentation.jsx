// src/pages/documentation/DocumentationPage.jsx
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Link, Routes, Navigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Container, Row, Nav } from 'react-bootstrap';

const docs = [
  { id: 'doc1', name: 'Client Contracts' },
  { id: 'doc2', name: 'Deploying in Edge Server' },
  { id: 'doc3', name: 'Uploading NFT' },
  // Add more documents as needed
];

const Sidebar = () => (
  <Nav className="col-md-2 d-md-block bg-light sidebar vh-100 position-fixed">
    <div className="sidebar-sticky">
        <h4 className='ms-3 mt-4 mb-4'>Quick Links</h4>
      {docs.map(doc => (
        <Nav.Item key={doc.id}>
          <Nav.Link as={Link} to={`/documentation/${doc.id}`}>{doc.name}</Nav.Link>
        </Nav.Item>
      ))}
    </div>
  </Nav>
);

const Documentation = () => {
  const { docId } = useParams();
  const [content, setContent] = useState('');

  useEffect(() => {
    fetch(`/docs/${docId}.md`)
      .then(response => response.text())
      .then(text => setContent(text))
      .catch(error => console.log(error));
  }, [docId]);

  return (
    <Container className="col-md-12 ml-auto px-1" style={{ height: '100vh', overflowY: 'scroll' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </Container>
  );
};

const DocumentationPage = () => (
  <div className="container-fluid">
    <Row>
      <Sidebar />
      <main role="main" className="col-md-9 ml-auto px-4 offset-md-3" style={{ height: '100vh', overflowY: 'scroll' }}>
        <Routes>
          <Route path="/:docId" element={<Documentation />} />
          <Route path="*" element={<Navigate to="/documentation/doc1" />} />
        </Routes>
      </main>
    </Row>
  </div>
);

export default DocumentationPage;
