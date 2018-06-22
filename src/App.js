import React, {Component} from 'react';
import logo from './logo.svg';
import './App.css';
import 'antd/dist/antd.css';
import {Menu, Icon, Button, Layout} from 'antd';

import {
  BrowserRouter,
  Route,
  Link
} from 'react-router-dom';


import DotPath from './practice/DotPath';


const SubMenu = Menu.SubMenu;
const {Header, Footer, Sider, Content} = Layout;

class App extends Component {
  render() {
    return (
        <BrowserRouter>
          <Layout>
            <Header>
              <img src={logo} className="App-logo" alt="logo"/>
              <h1 className="App-title">Welcome to React</h1>
              {/*<img src={logo} style={{height: 50}} className="App-logo" alt="logo"/>*/}
            </Header>
            <Layout>
              <Sider>
                <Menu
                    defaultSelectedKeys={['1']}
                    defaultOpenKeys={['sub1']}
                    mode="inline"
                    theme="light"
                    inlineCollapsed={false}
                >
                  <Menu.Item key="1">
                    <Icon type="pie-chart"/>
                    <span><Link to='/'>Home</Link></span>
                  </Menu.Item>
                  <Menu.Item key="2">
                    <Icon type="desktop"/>
                    <span><Link to='/MAPF/BasicAStar'>Basic A star</Link></span>
                  </Menu.Item>
                  <Menu.Item key="3">
                    <Icon type="inbox"/>
                    <span><Link to='/MAPF/Coop4'>Coop 4</Link></span>
                  </Menu.Item>
                  <Menu.Item key="4">
                    <Icon type="inbox"/>
                    <span><Link to='/MAPF/Coop30'>Coop 30</Link></span>
                  </Menu.Item>
                  <Menu.Item key="5">
                    <Icon type="inbox"/>
                    <span><Link to='/MAPF/RowByCol'>Rows by columns</Link></span>
                  </Menu.Item>
                  <SubMenu key="sub1" title={<span><Icon type="mail"/><span>practice</span></span>}>
                    <Menu.Item key="5"><Link to='/practice/DotPath'>DotPath</Link></Menu.Item>
                    <Menu.Item key="6"><Link to='/Tutorials/MakeGrid'>Grid</Link></Menu.Item>
                    <Menu.Item key="7"><Link to='/Tutorials/mowerDemo'>Mower</Link></Menu.Item>
                    <Menu.Item key="8"><Link to='/Tutorials/SimpleBarChart'>SimpleBarChart</Link></Menu.Item>
                    <Menu.Item key="8-1"><Link to='/Tutorials/Tetris'>Tetris</Link></Menu.Item>
                  </SubMenu>
                  <SubMenu key="sub2" title={<span><Icon type="appstore"/><span>Example</span></span>}>
                    <Menu.Item key="9">pasdf</Menu.Item>
                    <Menu.Item key="10">Option 10</Menu.Item>
                    <SubMenu key="sub3" title="Mouseover">
                      <Menu.Item key="11"></Menu.Item>
                      <Menu.Item key="12">Option 12</Menu.Item>
                    </SubMenu>
                  </SubMenu>
                </Menu>
              </Sider>
              <Content>
                {/*<Route exact path="/" component={Home}/>*/}
                 {/*<Route path="/example/BarChart" component={BarChart}/>*/}
                 {/*<Route path="/example/Test" component={Test}/>*/}

                 {/*<Route path="/MAPF/BasicAStar" component={BasicAStar}/>*/}
                 {/*<Route path="/MAPF/Coop4" component={Coop4}/>*/}
                 {/*<Route path="/MAPF/Coop30" component={Coop30}/>*/}
                 {/*<Route path="/MAPF/RowByCol" component={RowByCol}/>*/}

                 <Route path="/practice/DotPath" component={DotPath}/>

              </Content>
            </Layout>
            <Footer>
            </Footer>
          </Layout>
        </BrowserRouter>
    );
  }
}

export default App;
