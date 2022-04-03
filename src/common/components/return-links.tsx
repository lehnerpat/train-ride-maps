import styled from "styled-components";
import { Link } from "wouter";

export const ReturnLinkContainer = styled.div`
  font-size: 60%;
  text-align: center;
  margin: 20px 0;
`;

export const ReturnLink = styled(Link)`
  &,
  &:visited {
    color: #ddd;
  }

  &:hover,
  &:focus,
  &:active {
    color: white;
  }
`;
