/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  TouchableOpacity,
  Dimensions,
  PermissionsAndroid,
  Alert,
  Platform,
  AppState
} from 'react-native';
import {
  TwilioVideo,
  TwilioVideoLocalView,
  TwilioVideoParticipantView
} from 'react-native-twilio-video-webrtc'


export default class App extends Component {

  state = {
    isAudioEnabled: true,
    isVideoEnabled: true,
    status: 'disconnected',
    participants: new Map(),
    videoTracks: new Map(),
    roomName: '',
    token: '',
    appState: AppState.currentState
  }

  requestCameraPermission =
    async () => {
      try {
        const granted =
          await PermissionsAndroid.requestMultiple(
            [PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO],
            {
              'title':
                'Camera Permission',
              'message':
                'App needs access to your camera '
            }
          )
        if (granted ===
          PermissionsAndroid.RESULTS.GRANTED) {
        } else {
          console.log("Camera permission denied")
        }

      } catch (err) {
        console.warn(err)
      }
    }

    getAccessToken = async () => {
      try {
        fetch('http://52.172.45.185:9000/api/values/' + this.state.userName )
        .then((response) => 
          response.text().then((res) => {
           // alert("token"+res);
            this.setState({token: res});
          }))
      } catch (err) {
        console.warn(err)
      }
    }

    async componentDidMount() {
      if (Platform.OS === 'android') {
        this.requestCameraPermission().then(() => {
          //alert("success");
        })
          .catch(() => {
            //alert("error");
          })
      }
      AppState.addEventListener('change', this._handleAppStateChange);
    }
  
    componentWillUnmount() {
      AppState.removeEventListener('change', this._handleAppStateChange);
    }
  
    _handleAppStateChange = (nextAppState) => {
      if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground!')
      }
      this.setState({appState: nextAppState});
    }

    _onGenerateTokenPress = () => {
      this.getAccessToken().then(() => {
        //  alert('state token:'+this.state.token);
        //  alert("Token Generated"); 
       })
         .catch(() => {
           //alert("error");
         }) 
       }

    _onRoomDidConnect = () => {
    this.setState({status: 'connected'})
    //alert("Room Connected");
  }

  _onConnectButtonPress = () => {
    this.refs.twilioVideo.connect({ roomName: this.state.roomName, accessToken: this.state.token })
    //alert("Room Connecting");
    this.setState({status: 'connecting'})
  }

  _onEndButtonPress = () => {
    this.refs.twilioVideo.disconnect()
  }

  _onMuteButtonPress = () => {
    this.refs.twilioVideo.setLocalAudioEnabled(!this.state.isAudioEnabled)
      .then(isEnabled => this.setState({isAudioEnabled: isEnabled}))
  }

  _onFlipButtonPress = () => {
    this.refs.twilioVideo.flipCamera()
  }

  _onRoomDidDisconnect = ({roomName, error}) => {
    console.log("ERROR: ", error)

    this.setState({status: 'disconnected'})
  }

  _onRoomDidFailToConnect = (error) => {
    console.log("ERROR: ", error)

    this.setState({status: 'disconnected'})
  }

  _onParticipantAddedVideoTrack = ({participant, track}) => {
    console.log("onParticipantAddedVideoTrack: ", participant, track);

    const syncVideoTracks = this.state.videoTracks;
    for (const [key, value] of syncVideoTracks) {
      if (value.participantSid === participant.sid) {
        syncVideoTracks.delete(value.videoTrackSid);
      }
    }

    syncVideoTracks.set(track.trackSid, { participantSid: participant.sid, videoTrackSid: track.trackSid });

    this.setState({
      videoTracks: syncVideoTracks
    });
  }

  _onParticipantRemovedVideoTrack = ({participant, track}) => {
    console.log("onParticipantRemovedVideoTrack: ", participant, track)

    const syncVideoTracks = this.state.videoTracks;
    syncVideoTracks.delete(track.trackSid);

    this.setState({videoTracks: syncVideoTracks})
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>Current state is: {this.state.appState}</Text>
        {
          this.state.status === 'disconnected' &&
          <View>
            <Text style={styles.welcome}>
              React Native Twilio Video
            </Text>
            <TextInput
              style={styles.input}
              autoCapitalize='none'
              value={this.state.userName}
              placeholder="User Name"
              onChangeText={(text) => this.setState({userName: text})}>
            </TextInput>
            <TextInput
              style={styles.input}
              autoCapitalize='none'
              value={this.state.roomName}
              placeholder="Room Name"
              onChangeText={(text) => this.setState({roomName: text})}>
            </TextInput>

            <Text>{this.state.token}</Text>

            <Button
              title="Generate Token"
              style={styles.button}
              onPress={ this._onGenerateTokenPress}>
            </Button>
            <Text></Text>
            <Text></Text>
            <Text></Text>
            <Button
              title="Connect"
              style={styles.button}
              onPress={ this._onConnectButtonPress}>
            </Button>
          </View>
        }

        {
          (this.state.status === 'connected' || this.state.status === 'connecting') &&
            <View style={styles.callContainer}>
            {
              this.state.status === 'connected' &&
              <View style={styles.remoteGrid}>
                {
                  Array.from(this.state.videoTracks, ([trackId, track]) => {
                    return (
                      <TwilioVideoParticipantView
                        style={styles.remoteVideo}
                        key={trackId}
                        trackIdentifier={{
                          participantSid: track.participantSid,
                          videoTrackSid: trackId
                        }}
                      />
                    )
                  })
                }
              </View>
            }
            <View
              style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={this._onEndButtonPress}>
                <Text style={{fontSize: 12}}>End</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={this._onMuteButtonPress}>
                <Text style={{fontSize: 12}}>{ this.state.isAudioEnabled ? "Mute" : "Unmute" }</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={this._onFlipButtonPress}>
                <Text style={{fontSize: 12}}>Flip</Text>
              </TouchableOpacity>
              <TwilioVideoLocalView
                enabled={true}
                style={styles.localVideo}
              />
            </View>
          </View>
        }

        <TwilioVideo
          ref="twilioVideo"
          onRoomDidConnect={ this._onRoomDidConnect }
          onRoomDidDisconnect={ this._onRoomDidDisconnect }
          onRoomDidFailToConnect= { this._onRoomDidFailToConnect }
          onParticipantAddedVideoTrack={ this._onParticipantAddedVideoTrack }
          onParticipantRemovedVideoTrack= { this._onParticipantRemovedVideoTrack }
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white'
  },
  callContainer: {
    flex: 1,
    position: "absolute",
    bottom: 0,
    top: 0,
    left: 0,
    right: 0
  },
  welcome: {
    fontSize: 30,
    textAlign: 'center',
    paddingTop: 40
  },
  input: {
    height: 50,
    borderWidth: 1,
    marginRight: 70,
    marginLeft: 70,
    marginTop: 50,
    textAlign: 'center',
    backgroundColor: 'white'
  },
  button: {
    marginTop: 100
  },
  localVideo: {
    flex: 1,
    width: 150,
    height: 250,
    position: "absolute",
    right: 10,
    bottom: 10
  },
  remoteGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: 'wrap'
  },
  remoteVideo: {
    marginTop: 20,
    marginLeft: 10,
    marginRight: 10,
    width: 100,
    height: 120,
  },
  optionsContainer: {
    position: "absolute",
    left: 0,
    bottom: 0,
    right: 0,
    height: 100,
    backgroundColor: 'blue',
    flexDirection: "row",
    alignItems: "center"
  },
  optionButton: {
    width: 60,
    height: 60,
    marginLeft: 10,
    marginRight: 10,
    borderRadius: 100 / 2,
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: "center"
  }
});
