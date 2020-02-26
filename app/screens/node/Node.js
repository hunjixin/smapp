// @flow
import { shell, clipboard } from 'electron';
import React, { Component } from 'react';
import styled from 'styled-components';
import { connect } from 'react-redux';
import { getUpcomingRewards } from '/redux/node/actions';
import { CorneredContainer } from '/components/common';
import { WrapperWith2SideBars, Link, Button } from '/basicComponents';
import { ScreenErrorBoundary } from '/components/errorHandler';
import { localStorageService } from '/infra/storageService';
import { getAbbreviatedText, getFormattedTimestamp, formatSmidge } from '/infra/utils';
import { playIcon, pauseIcon, fireworks } from '/assets/images';
import { smColors, nodeConsts } from '/vars';
import type { RouterHistory } from 'react-router-dom';
// import type { Action } from '/types';

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const LogInnerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-y: visible;
  overflow-x: hidden;
  padding: 0 10px;
`;

const LogEntry = styled.div`
  display: flex;
  flex-direction: column;
`;

const LogText = styled.div`
  font-size: 16px;
  line-height: 20px;
  color: ${smColors.black};
`;

const AwardText = styled(LogText)`
  color: ${smColors.green};
`;

const LogEntrySeparator = styled(LogText)`
  margin: 15px 0;
  line-height: 16px;
`;

const Text = styled.div`
  font-size: 16px;
  line-height: 23px;
  color: ${smColors.realBlack};
`;

const BoldText = styled(Text)`
  font-family: SourceCodeProBold;
  margin-top: 20px;
`;

const Footer = styled.div`
  display: flex;
  flex-direction: row;
  flex: 1;
  justify-content: space-between;
  align-items: flex-end;
`;

const Status = styled.div`
  font-size: 16px;
  line-height: 20px;
  color: ${({ status }) => (status ? smColors.green : smColors.orange)};
  margin-bottom: 30px;
`;

const TextWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-bottom: 20px;
`;

const LeftText = styled.div`
  margin-right: 15px;
  font-size: 16px;
  line-height: 20px;
  color: ${smColors.realBlack};
`;

const RightText = styled.div`
  flex: 1;
  margin-right: 0;
  margin-left: 15px;
  text-align: right;
`;

const GreenText = styled(RightText)`
  color: ${smColors.green};
`;

const Dots = styled(LeftText)`
  margin: 0 auto;
  flex-shrink: 1;
  overflow: hidden;
`;

const Fireworks = styled.img`
  position: absolute;
  top: 50px;
  max-width: 100%;
  max-height: 100%;
  cursor: inherit;
`;

const inlineLinkStyle = { display: 'inline', fontSize: '16px', lineHeight: '20px' };

type Props = {
  status: Object,
  miningStatus: number,
  // timeTillNextAward: number,
  totalEarnings: number,
  totalFeesEarnings: number,
  // getUpcomingRewards: Action,
  rewardsAddress: string,
  history: RouterHistory,
  location: { state?: { showIntro?: boolean } }
};

type State = {
  showIntro: boolean,
  isMiningPaused: boolean,
  showFireworks: boolean,
  copied: boolean
};

class Node extends Component<Props, State> {
  getUpcomingAwardsInterval: IntervalID;

  fireworksTimeout: TimeoutID;

  constructor(props) {
    super(props);
    const { location } = props;
    this.state = {
      showIntro: !!location?.state?.showIntro,
      isMiningPaused: false,
      showFireworks: !!location?.state?.showIntro,
      copied: false
    };
  }

  render() {
    const rewards = localStorageService.get('rewards') || [];
    let smesherInitTimestamp = localStorageService.get('smesherInitTimestamp');
    smesherInitTimestamp = smesherInitTimestamp ? getFormattedTimestamp(smesherInitTimestamp) : '';
    let smesherSmeshingTimestamp = localStorageService.get('smesherSmeshingTimestamp');
    smesherSmeshingTimestamp = smesherSmeshingTimestamp ? getFormattedTimestamp(smesherSmeshingTimestamp) : '';
    return (
      <Wrapper>
        <WrapperWith2SideBars width={650} height={480} header="SMESHER" style={{ marginRight: 10 }}>
          {this.renderMainSection()}
        </WrapperWith2SideBars>
        <CorneredContainer width={310} height={480} header="SMESHER LOG">
          <LogInnerWrapper>
            {smesherInitTimestamp ? (
              <>
                <LogEntry>
                  <LogText>{smesherInitTimestamp}</LogText>
                  <LogText>Initializing smesher</LogText>
                </LogEntry>
                <LogEntrySeparator>...</LogEntrySeparator>
              </>
            ) : null}
            {smesherSmeshingTimestamp ? (
              <>
                <LogEntry>
                  <LogText>{smesherSmeshingTimestamp}</LogText>
                  <LogText>Started smeshing</LogText>
                </LogEntry>
                <LogEntrySeparator>...</LogEntrySeparator>
              </>
            ) : null}
            {rewards.map((reward, index) => (
              <div key={`reward${index}`}>
                <LogEntry>
                  <LogText>{getFormattedTimestamp(reward.timestamp)}</LogText>
                  <AwardText>Smeshing reward: {formatSmidge(reward.totalReward)}</AwardText>
                  <AwardText>Smeshing fee reward: {formatSmidge(reward.totalReward - reward.layerRewardEstimate)}</AwardText>
                </LogEntry>
                <LogEntrySeparator>...</LogEntrySeparator>
              </div>
            ))}
          </LogInnerWrapper>
        </CorneredContainer>
      </Wrapper>
    );
  }

  // async componentDidMount() {
  //   const { status, miningStatus, getUpcomingRewards } = this.props;
  //   if (status?.synced && miningStatus === nodeConsts.IS_MINING) {
  //     await getUpcomingRewards();
  //     this.getUpcomingAwardsInterval = setInterval(getUpcomingRewards, 30000);
  //   }
  // }

  componentWillUnmount() {
    // this.getUpcomingAwardsInterval && clearInterval(this.getUpcomingAwardsInterval);
    this.fireworksTimeout && clearTimeout(this.fireworksTimeout);
  }

  renderMainSection = () => {
    const { miningStatus } = this.props;
    const { showIntro, showFireworks } = this.state;
    if (showIntro) {
      return showFireworks ? this.renderFireworks() : this.renderIntro();
    } else if (miningStatus === nodeConsts.NOT_MINING) {
      return this.renderPreSetup();
    }
    return this.renderNodeDashboard();
  };

  renderFireworks = () => {
    this.fireworksTimeout = setTimeout(() => {
      this.setState({ showFireworks: false });
    }, 1500);
    return <Fireworks key="fireworks" src={fireworks} />;
  };

  renderIntro = () => {
    return [
      <BoldText key="1">Success! You are now a Spacemesh Testnet member!</BoldText>,
      <Text key="2">* You will get a desktop notification about your smeshing rewards in about 48 hours</Text>,
      <Text key="3">* You can close this window and choose to keep smeshing the background</Text>,
      <BoldText key="4">Important</BoldText>,
      <Text key="5">* Leave your computer on 24/7 to smesh and to earn smeshing rewards</Text>,
      <Text key="6">
        * <Link onClick={this.navigateToPreventComputerSleep} text="Disable your computer from going to sleep" style={inlineLinkStyle} />
      </Text>,
      <Text key="7">
        * Configure your network to accept incoming app connections.
        <Link onClick={this.navigateToNetConfigGuide} text="Learn more." style={inlineLinkStyle} />
      </Text>,
      <Text key="8" style={{ display: 'flex', flexDirection: 'row' }}>
        *&nbsp;
        <Link onClick={this.navigateToMiningGuide} text="Learn more about smeshing" style={inlineLinkStyle} />
      </Text>,
      <Footer key="footer">
        <Link onClick={this.navigateToMiningGuide} text="SMESHING GUIDE" />
        <Button onClick={() => this.setState({ showIntro: false })} text="GOT IT" width={175} />
      </Footer>
    ];
  };

  renderPreSetup = () => {
    const { history } = this.props;
    return [
      <BoldText key="1">You are not smeshing yet.</BoldText>,
      <br key="2" />,
      <Text key="3">Setup smeshing to join Spacemesh and earn Smesh rewards.</Text>,
      <br key="4" />,
      <br key="5" />,
      <Text key="6">{`Setup requires ${nodeConsts.COMMITMENT_SIZE} GB of free disk space.`}</Text>,
      <Text key="7">You will start earning Smesh rewards in about 48 hours.</Text>,
      <Footer key="footer">
        <Link onClick={this.navigateToMiningGuide} text="SMESHING GUIDE" />
        <Button onClick={() => history.push('/main/node-setup', { isOnlyNodeSetup: true })} text="BEGIN SETUP" width={175} />
      </Footer>
    ];
  };

  renderNodeDashboard = () => {
    const { status, totalEarnings, totalFeesEarnings, rewardsAddress } = this.props;
    const { isMiningPaused, copied } = this.state;
    return [
      <Status key="status" status={status}>
        {status ? 'Your Smesher is online.' : 'Not connected!'}
      </Status>,
      <TextWrapper key="2">
        <LeftText>Total Smeshing Rewards</LeftText>
        <Dots>..................</Dots>
        <GreenText>{formatSmidge(totalEarnings)}</GreenText>
      </TextWrapper>,
      <TextWrapper key="3">
        <LeftText>Total Fees Rewards</LeftText>
        <Dots>..................</Dots>
        <GreenText>{formatSmidge(totalFeesEarnings)}</GreenText>
      </TextWrapper>,
      <TextWrapper key="4">
        <LeftText>Rewards Account</LeftText>
        <Dots>..................</Dots>
        <GreenText>{getAbbreviatedText(rewardsAddress, true, 8)}</GreenText>
      </TextWrapper>,
      <TextWrapper key="5">
        <Button onClick={this.copyRewardsAccount} text="Copy reward account" width={155} />
        {copied && <GreenText>Copied</GreenText>}
      </TextWrapper>,
      <Footer key="footer">
        <Link onClick={this.navigateToMiningGuide} text="SMESHING GUIDE" />
        {false && (
          <Button
            onClick={this.pauseResumeMining}
            text={isMiningPaused ? 'RESUME SMESHING' : 'PAUSE SMESHING'}
            width={175}
            imgPosition="before"
            img={isMiningPaused ? playIcon : pauseIcon}
            isDisabled
          />
        )}
      </Footer>
    ];
  };

  copyRewardsAccount = () => {
    const { rewardsAddress } = this.props;
    clipboard.writeText(rewardsAddress);
    this.setState({ copied: true });
  };

  pauseResumeMining = () => {};

  navigateToMiningGuide = () => shell.openExternal('https://testnet.spacemesh.io/#/guide/setup');

  navigateToNetConfigGuide = () => shell.openExternal('https://testnet.spacemesh.io/#/netconfig');

  navigateToPreventComputerSleep = () => shell.openExternal('https://testnet.spacemesh.io/#/no_sleep');
}

const mapStateToProps = (state) => ({
  status: state.node.status,
  miningStatus: state.node.miningStatus,
  timeTillNextAward: state.node.timeTillNextAward,
  totalEarnings: state.node.totalEarnings,
  totalFeesEarnings: state.node.totalFeesEarnings,
  rewardsAddress: state.node.rewardsAddress
});

const mapDispatchToProps = {
  getUpcomingRewards
};

Node = connect<any, any, _, _, _, _>(mapStateToProps, mapDispatchToProps)(Node);

Node = ScreenErrorBoundary(Node);
export default Node;
