package watchdog

import (
	"io/ioutil"
	"net/http"
	"net/http/httptest"
)

type response struct {
	httpMethod string
	data       []byte
}

type mockK8sServer struct {
	urlToResponse map[string]*response
	server        *httptest.Server
}

func newMockK8sServer() *mockK8sServer {
	return &mockK8sServer{
		urlToResponse: make(map[string]*response),
	}
}

func (m *mockK8sServer) addResponseByFile(url string, respFileName string, method string) {
	data, _ := ioutil.ReadFile(respFileName)
	m.urlToResponse[url] = &response{
		httpMethod: method,
		data:       data,
	}
}

func (m *mockK8sServer) addResponse(url string, resp string, method string) {
	m.urlToResponse[url] = &response{
		httpMethod: method,
		data:       []byte(resp),
	}
}

func (m *mockK8sServer) start() string {
	m.server = httptest.NewServer(
		http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
			resp, exist := m.urlToResponse[req.URL.Path]
			if exist && req.Method == resp.httpMethod {
				rw.Header().Set("Content-Type", "application/json")
				rw.Write(resp.data)
			}
			rw.WriteHeader(http.StatusNotFound)
		}),
	)
	return m.server.URL
}

func (m *mockK8sServer) stop() {
	m.server.Close()
}
