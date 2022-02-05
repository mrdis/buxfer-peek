import './App.css';

import {useLocalStorage} from 'react-use'
import Login from './components/Login';
import View from './components/View';



function App() {
  const [authToken, setAuthToken] = useLocalStorage("authToken", "");

  if(authToken == ""){
    return Login(
      (token)=>{
        setAuthToken(token)
      },
      (status)=>{
        console.log(status)
      }
    );
  }else{
    return View({authToken});
  }
}

export default App;
