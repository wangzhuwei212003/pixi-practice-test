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
import VirtualCar from './practice/VirtualCar';

import helloWorld from './Learning/helloWorld';
import spriteFromImage from './Learning/spriteFromImage';
import spriteFromTileset from './Learning/spriteFromTileset';
import moving from './Learning/moving';
import groupSprite from './Learning/groupSprite';
import primitiveText from './Learning/primitiveText';


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
                    defaultOpenKeys={['sub1-practice']}
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
                  <SubMenu key="sub1-practice" title={<span><Icon type="mail"/><span>practice</span></span>}>
                    <Menu.Item key="5"><Link to='/practice/DotPath'>DotPath</Link></Menu.Item>
                    <Menu.Item key="5-VirtualCar"><Link to='/practice/VirtualCar'>VirtualCar</Link></Menu.Item>

                  </SubMenu>
                  <SubMenu key="sub2" title={<span><Icon type="appstore"/><span>kittykatattack/learningPixi</span></span>}>
                    <Menu.Item key="9"><Link to='/Learning/helloWorld'>helloWorld</Link></Menu.Item>
                    <Menu.Item key="10"><Link to='/Learning/spriteFromImage'>spriteFromImage</Link></Menu.Item>
                    <Menu.Item key="10-1"><Link to='/Learning/spriteFromTileset'>spriteFromTileset</Link></Menu.Item>
                    <Menu.Item key="10-2"><Link to='/Learning/moving'>moving</Link></Menu.Item>
                    <Menu.Item key="10-groupSprite"><Link to='/Learning/groupSprite'>groupSprite</Link></Menu.Item>
                    <Menu.Item key="10-primitiveText"><Link to='/Learning/primitiveText'>primitiveText</Link></Menu.Item>

                    <SubMenu key="sub3" title="ToBeContinued...">
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


                 <Route path="/Learning/helloWorld" component={helloWorld}/>
                 <Route path="/Learning/spriteFromImage" component={spriteFromImage}/>
                 <Route path="/Learning/spriteFromTileset" component={spriteFromTileset}/>
                 <Route path="/Learning/moving" component={moving}/>
                 <Route path="/Learning/groupSprite" component={groupSprite}/>
                 <Route path="/Learning/primitiveText" component={primitiveText}/>

                 <Route path="/practice/DotPath" component={DotPath}/>
                 <Route path="/practice/VirtualCar" component={VirtualCar}/>

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
